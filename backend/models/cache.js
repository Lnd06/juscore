import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cache = sequelize.define('Cache', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  data: {
    type: DataTypes.TEXT('long'), // Pode ser grande (JSON ou texto)
    allowNull: false,
    get() {
        // Parse JSON automatically if it looks like JSON
        const rawValue = this.getDataValue('data');
        try {
            return JSON.parse(rawValue);
        } catch {
            return rawValue;
        }
    },
    set(value) {
        // Stringify if object
        if (typeof value === 'object') {
            this.setDataValue('data', JSON.stringify(value));
        } else {
            this.setDataValue('data', value);
        }
    }
  },
  expireAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

export default Cache;
