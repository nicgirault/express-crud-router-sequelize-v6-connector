import { DataTypes, Op, Sequelize } from 'sequelize'
import { prepareQuery } from './searchList'

describe('crud', () => {
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

  it('handle autocomplete query', () => {
    expect(
        prepareQuery(IdModel, ['field1', 'field2'])('some mustach')
    ).toEqual(
      {
        [Op.or]: [
          {
            [Op.or]: [
              {
                field1: { [Op.iLike]: '%some mustach%' },
              },
              {
                field2: { [Op.iLike]: '%some mustach%' },
              },
            ],
          },
          {
            [Op.or]: [
              { field1: { [Op.iLike]: '%some%' } },
              { field2: { [Op.iLike]: '%some%' } },
            ],
          },
          {
            [Op.or]: [
              { field1: { [Op.iLike]: '%mustach%' } },
              { field2: { [Op.iLike]: '%mustach%' } },
            ],
          },
        ],
      },
    )
  })

  it('supports alternate comparators', () => {
    expect(
      prepareQuery(IdModel, ['field1'])('some mustach', Op.like)
    ).toEqual(
      {
        [Op.or]: [
          {
            [Op.or]: [{ field1: { [Op.like]: '%some mustach%' } }],
          },
          {
            [Op.or]: [{ field1: { [Op.like]: '%some%' } }],
          },
          {
            [Op.or]: [{ field1: { [Op.like]: '%mustach%' } }],
          },
        ],
      },
    )
  })

  it('does only one lookup for single tokens', () => {
    expect(prepareQuery(IdModel, ['field1'])('mustach')).toEqual(
      {
        [Op.or]: [
          {
            field1: { [Op.iLike]: '%mustach%' },
          },
        ],
      },
    )
  })

  it('adopts query for uuid fields', () => {
    const uuid = 'a2b7edef-84a2-4dff-a05d-0374c170c07b'
    expect(prepareQuery(UuidModel, ['id'])(uuid)).toEqual(
      {
        [Op.or]: [
          {
            id: { [Op.eq]: uuid },
          },
        ],
      })
    expect(prepareQuery(UuidModel, ['id', 'title'])(uuid)).toEqual(
      {
        [Op.or]: [
          {
            id: { [Op.eq]: uuid },
          },
          {
            title: { [Op.iLike]: `%${uuid}%` },
          },
        ],
      },
    )
    expect(prepareQuery(UuidModel, ['id', 'title'])('mustach')).toEqual(
      {
        [Op.or]: [
          {
            title: { [Op.iLike]: '%mustach%' },
          },
        ],
      },
    )
  })
})
