import { usersApi } from '@/lib/api';

export const userService = {
  async getTotalUsers(): Promise<number> {
    try {
      const users = await usersApi.getAll();
      return users.length;
    } catch {
      console.warn('Failed to fetch users, returning 0');
      return 0;
    }
  },

  async getUserStats() {
    try {
      const users = await usersApi.getAll();
      const total = users.length;
      const active = users.filter(user => user.status === 'active').length;
      const inactive = total - active;

      const students = users.filter(user => user.role === 'student').length;
      const coordinators = users.filter(user => user.role === 'coordinator').length;
      const admins = users.filter(user => user.role === 'admin').length;

      return {
        total,
        active,
        inactive,
        activePercentage: Math.round((active / total) * 100) || 0,
        distribution: {
          students,
          coordinators,
          admins
        }
      };
    } catch {
      console.warn('Failed to fetch user stats, returning zeros');
      return {
        total: 0,
        active: 0,
        inactive: 0,
        activePercentage: 0,
        distribution: {
          students: 0,
          coordinators: 0,
          admins: 0
        }
      };
    }
  }
};
