import { DataTypes } from 'sequelize';
import sequelize from '../db/db.js';

const Contact = sequelize.define('Contact', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    picture: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'contacts',
    timestamps: true,
});

export default Contact;
