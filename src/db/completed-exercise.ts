import { Sequelize, DataTypes, Model } from 'sequelize'
import { UserModel } from './user'
import { ExerciseModel } from './exercise'

export interface CompletedExerciseModel extends Model {
  id: number
  userId: number
  exerciseId: number
  completedAt: Date
  duration: number

  user?: UserModel
  exercise?: ExerciseModel
}

export default (sequelize: Sequelize, modelName: string) => {
  const CompletedExerciseModelCtor = sequelize.define<CompletedExerciseModel>(
    modelName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      exerciseId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      paranoid: true,
      timestamps: true,
      tableName: 'completed_exercises'
    }
  )

  CompletedExerciseModelCtor.associate = (models) => {
    CompletedExerciseModelCtor.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        allowNull: false
      },
      as: 'user'
    })

    CompletedExerciseModelCtor.belongsTo(models.Exercise, {
      foreignKey: {
        name: 'exerciseId',
        allowNull: false
      },
      as: 'exercise'
    })
  }

  return CompletedExerciseModelCtor
}
