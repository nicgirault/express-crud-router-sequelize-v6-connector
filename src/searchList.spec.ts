import { DataTypes, Op, Sequelize } from 'sequelize'
import { simpleSequelizeSearch } from './searchList'

describe('simpleSequelizeSearch', () => {
  const sequelize = new Sequelize('sqlite::memory:')

  const IdModel = sequelize.define(
    'IdModel',
    {
      // Model attributes are defined here
      id: {
        type: DataTypes.NUMBER,
        allowNull: false,
        primaryKey: true,
      },
      field1: {
        type: DataTypes.STRING,
      },
      field2: {
        type: DataTypes.STRING,
      },
    },
    {
      modelName: 'IdModel',
    }
  )

  const UuidModel = sequelize.define(
    'UuidModel',
    {
      // Model attributes are defined here
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
      },
    },
    {
      modelName: 'UuidModel',
    }
  )

  it('handles autocomplete query', () => {
    expect(
      simpleSequelizeSearch(IdModel, ['field1', 'field2'])('some mustach')
    ).toEqual({
      [Op.or]: [
        {
          field1: { [Op.iLike]: '%some mustach%' },
        },
        {
          field2: { [Op.iLike]: '%some mustach%' },
        },
      ],
    })
  })

  it('supports alternate comparators', () => {
    expect(
      simpleSequelizeSearch(IdModel, ['field1'], Op.like)('some mustach')
    ).toEqual({
      [Op.or]: [
        {
          field1: { [Op.like]: '%some mustach%' },
        },
      ],
    })
  })

  it('adapts query for uuid fields', () => {
    expect(simpleSequelizeSearch(UuidModel, ['id'])('123-123')).toEqual({
      [Op.or]: [
        {
          id: { [Op.eq]: '123-123' },
        },
      ],
    })
    expect(simpleSequelizeSearch(UuidModel, ['id', 'title'])('123-123')).toEqual({
      [Op.or]: [
        {
          id: { [Op.eq]: '123-123' },
        },
        {
          title: { [Op.iLike]: '%123-123%' },
        },
      ],
    })
  })
})
