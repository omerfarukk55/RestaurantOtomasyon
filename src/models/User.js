// src/models/User.js
class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.password = data.password;
        this.full_name = data.full_name;
        this.role = data.role;
        this.phone = data.phone;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Model metodları
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            full_name: this.full_name,
            role: this.role,
            phone: this.phone,
            is_active: this.is_active,
            created_at: this.created_at
        };
    }

    // Statik metodlar
    static fromDB(data) {
        return new User(data);
    }

    static getTableName() {
        return 'users';
    }

    // Validation metodları
    static validateRole(role) {
        const validRoles = ['cashier', 'waiter'];
        return validRoles.includes(role);
    }

    static validateUsername(username) {
        return username && username.length >= 3;
    }

    static validatePassword(password) {
        return password && password.length >= 6;
    }
}

module.exports = User;