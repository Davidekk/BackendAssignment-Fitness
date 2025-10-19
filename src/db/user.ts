import { DataTypes, Model, Sequelize } from 'sequelize'

import { USER_ROLE } from '../utils/enums'

export interface UserModel extends Model {
  id: number
  name: string
  surname: string
  nickName: string
  email: string
  password: string
  age: number | null
  role: USER_ROLE
}

export default (sequelize: Sequelize, modelName: string) => {
  return sequelize.define<UserModel>(
    modelName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      surname: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      nickName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      role: {
        type: DataTypes.ENUM(...Object.values(USER_ROLE)),
        allowNull: false,
        defaultValue: USER_ROLE.USER
      }
    },
    {
      paranoid: true,
      timestamps: true,
      tableName: 'users'
    }
  )
}
