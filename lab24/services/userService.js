const User = require('../models/user');

class UserService {
    static async getAllUsers(options) {
        return User.findAll(options);
    }

    static async getUserById(id) {
        const user = await User.findById(id);

        if (!user) {
            const error = new Error('User not found');
            error.status = 404;
            throw error;
        }

        return user;
    }

    static async createUser(data) {
        const existingUser = await User.findByEmail(data.email);

        if (existingUser) {
            const error = new Error('Email already exists');
            error.status = 409;
            throw error;
        }

        return User.create(data);
    }

    static async updateUser(id, data) {
        const existingUser = await User.findByEmail(data.email);

        if (existingUser && existingUser._id.toString() !== id) {
            const error = new Error('Email already exists');
            error.status = 409;
            throw error;
        }

        const user = await User.update(id, data);

        if (!user) {
            const error = new Error('User not found');
            error.status = 404;
            throw error;
        }

        return user;
    }

    static async deleteUser(id) {
        const deleted = await User.delete(id);

        if (!deleted) {
            const error = new Error('User not found');
            error.status = 404;
            throw error;
        }

        return { message: 'User deleted successfully' };
    }

    static async searchUsers(query) {
        return User.search(query);
    }

    static async getStatistics() {
        return User.getStats();
    }

    static async exportUsers() {
        return User.exportAll();
    }
}

module.exports = UserService;