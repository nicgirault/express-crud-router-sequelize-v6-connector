import { DataTypes, Sequelize } from 'sequelize'
import { findAndCountAll } from './helpers'

const testData = [
  {
    id: 1,
    field1: 'field 1 value',
    field2: 'field 2 value',
  },
]
describe('findAndCountAll', () => {
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

  beforeAll(async () => {
    await IdModel.sync()
    await IdModel.create(testData[0])
  })

  it('returns correct pagination count', async () => {
    const { count } = await findAndCountAll(IdModel, {
      where: {},
      limit: 2,
      offset: 0,
      order: [],
    })
    expect(count).toBe(1)
  })

  it('returns correct partial pagination count', async () => {
    const { count } = await findAndCountAll(
      IdModel,
      {
        where: {},
        limit: 2,
        offset: 0,
        order: [],
      },
      {
        partialPagination: true,
      }
    )
    expect(count).toBe(1)
  })
})
