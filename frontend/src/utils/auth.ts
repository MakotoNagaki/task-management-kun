/**
 * 認証ユーティリティ - セキュア認証システム（修正版）
 * タスク管理くん用セキュリティ機能
 */

// 型のインポートを修正
import type { User } from '../types';
import type { AuthCredentials, AuthResult } from '../types/auth';

/**
 * 簡易パスワードハッシュ化（フロントエンド用）
 */
export class PasswordHasher {
  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'task-management-kun-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const inputHash = await this.hashPassword(password);
    return inputHash === hashedPassword;
  }
}

/**
 * セッショントークン生成器
 */
export class TokenGenerator {
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static generateSessionToken(userId: string): string {
    const payload = {
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      jti: this.generateToken()
    };
    return btoa(JSON.stringify(payload));
  }

  static verifySessionToken(token: string): { valid: boolean; userId?: string; expired?: boolean } {
    try {
      const payload = JSON.parse(atob(token));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp < now) {
        return { valid: false, expired: true };
      }
      
      return { valid: true, userId: payload.userId };
    } catch {
      return { valid: false };
    }
  }
}

/**
 * 認証サービス
 */
export class AuthService {
  static async authenticate(credentials: AuthCredentials, users: User[]): Promise<AuthResult> {
    try {
      const user = users.find(u => 
        u.email.toLowerCase() === credentials.email.toLowerCase() ||
        u.id === credentials.email
      );

      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'ユーザーが見つかりません',
            timestamp: new Date()
          }
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          error: {
            code: 'USER_INACTIVE',
            message: 'このアカウントは無効化されています',
            timestamp: new Date()
          }
        };
      }

      const isPasswordValid = await PasswordHasher.verifyPassword(
        credentials.password, 
        user.hashedPassword || ''
      );

      if (!isPasswordValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'メールアドレスまたはパスワードが間違っています',
            timestamp: new Date()
          }
        };
      }

      const sessionToken = TokenGenerator.generateSessionToken(user.id);

      return {
        success: true,
        data: {
          user,
          sessionToken,
          expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000))
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: '認証処理中にエラーが発生しました',
          timestamp: new Date()
        }
      };
    }
  }
}

/**
 * 権限管理システム
 */
export class PermissionManager {
  private static readonly ROLE_HIERARCHY: Record<string, number> = {
    'viewer': 1,
    'member': 2,
    'manager': 3,
    'admin': 4
  };

  private static readonly FEATURE_PERMISSIONS: Record<string, string> = {
    'create_user': 'admin',
    'delete_user': 'admin',
    'edit_user': 'manager',
    'manage_teams': 'manager',
    'create_task': 'member',
    'edit_task': 'member',
    'delete_task': 'member',
    'view_tasks': 'viewer',
    'manage_settings': 'admin',
    'view_reports': 'manager',
    'export_data': 'manager'
  };

  static hasPermission(user: User | null, feature: string): boolean {
    if (!user || !user.isActive) return false;
    
    const requiredRole = this.FEATURE_PERMISSIONS[feature];
    if (!requiredRole) return false;
    
    const userLevel = this.ROLE_HIERARCHY[user.role] || 0;
    const requiredLevel = this.ROLE_HIERARCHY[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  }

  static hasRole(user: User | null, requiredRole: string): boolean {
    if (!user || !user.isActive) return false;
    
    const userLevel = this.ROLE_HIERARCHY[user.role] || 0;
    const requiredLevel = this.ROLE_HIERARCHY[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  }

  static isAdmin(user: User | null): boolean {
    return this.hasRole(user, 'admin');
  }

  static isManagerOrAbove(user: User | null): boolean {
    return this.hasRole(user, 'manager');
  }

  static getAvailableFeatures(user: User | null): string[] {
    if (!user) return [];
    
    return Object.keys(this.FEATURE_PERMISSIONS).filter(feature => 
      this.hasPermission(user, feature)
    );
  }
}

/**
 * デフォルトユーザー作成
 */
export class DefaultUserCreator {
  static async createDefaultAdmin(): Promise<User> {
    const defaultPassword = 'admin123';
    const hashedPassword = await PasswordHasher.hashPassword(defaultPassword);

    return {
      id: 'admin_001',
      name: 'システム管理者',
      email: 'admin@company.com',
      role: 'admin',
      department: 'IT部',
      position: 'システム管理者',
      teamIds: [],
      primaryTeamId: undefined,
      isActive: true,
      hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        theme: 'light',
        language: 'ja',
        notifications: {
          email: true,
          slack: true,
          browser: true,
          sound: true,
          dueDate: true,
          taskAssigned: true,
          taskCompleted: true,
          teamMention: true
        },
        defaultAssigneeType: 'both',
        workingHours: {
          start: '09:00',
          end: '18:00'
        }
      }
    };
  }

  static async createTestUsers(): Promise<User[]> {
    const testUsers = [
      {
        id: 'user_001',
        name: '田中太郎',
        email: 'tanaka@company.com',
        role: 'manager',
        department: '開発部',
        position: 'シニアエンジニア',
        password: 'password123'
      },
      {
        id: 'user_002',
        name: '佐藤花子',
        email: 'sato@company.com',
        role: 'member',
        department: '開発部',
        position: 'エンジニア',
        password: 'password123'
      },
      {
        id: 'user_003',
        name: '鈴木一郎',
        email: 'suzuki@company.com',
        role: 'member',
        department: '開発部',
        position: 'エンジニア',
        password: 'password123'
      }
    ];

    const users: User[] = [];
    
    for (const testUser of testUsers) {
      const hashedPassword = await PasswordHasher.hashPassword(testUser.password);
      
      users.push({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role as any,
        department: testUser.department,
        position: testUser.position,
        teamIds: [],
        primaryTeamId: undefined,
        isActive: true,
        hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          theme: 'light',
          language: 'ja',
          notifications: {
            email: true,
            slack: false,
            browser: true,
            sound: false,
            dueDate: true,
            taskAssigned: true,
            taskCompleted: true,
            teamMention: true
          },
          defaultAssigneeType: 'user',
          workingHours: {
            start: '09:00',
            end: '18:00'
          }
        }
      });
    }

    return users;
  }
}

/**
 * セキュリティ監査
 */
export class SecurityAudit {
  static logLoginAttempt(email: string, success: boolean, ipAddress?: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      email,
      success,
      ipAddress: ipAddress || 'unknown',
      userAgent: navigator.userAgent
    };

    const auditKey = 'task-management-kun-audit-log';
    const existingLogs = JSON.parse(localStorage.getItem(auditKey) || '[]');
    existingLogs.push(logEntry);
    
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    
    localStorage.setItem(auditKey, JSON.stringify(existingLogs));
    console.log('ログイン試行を記録:', logEntry);
  }
}

/**
 * エクスポート用のメイン認証クラス
 */
export class Auth {
  static PasswordHasher = PasswordHasher;
  static TokenGenerator = TokenGenerator;
  static AuthService = AuthService;
  static PermissionManager = PermissionManager;
  static DefaultUserCreator = DefaultUserCreator;
  static SecurityAudit = SecurityAudit;
}

export default Auth;