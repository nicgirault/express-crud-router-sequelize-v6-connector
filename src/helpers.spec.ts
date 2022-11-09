import { DataTypes, Sequelize } from 'sequelize'
import { findAndCountAll } from './helpers'

const testData = [
  {
    id: 1,
    field1: 'record 1 field 1',
    field2: 'record 1 field 2',
  },
  {
    id: 2,
    field1: 'record 2 field 1',
    field2: 'record 2 field 2',
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
    for (const entry of testData) {
      await IdModel.create(entry)
    }
  })

  it('returns correct pagination count', async () => {
    const { count } = await findAndCountAll(IdModel, {
      where: {},
      limit: 5,
      offset: 0,
      order: [],
    })
    expect(count).toBe(2)
  })

  it('returns correct partial pagination count', async () => {
    const { count } = await findAndCountAll(
      IdModel,
      {
        where: {},
        limit: 5,
        offset: 0,
        order: [],
      },
      {
        partialPagination: true,
      }
    )
    expect(count).toBe(2)
  })

  it('applies override', async () => {
    const { count } = await findAndCountAll(
      IdModel,
      {
        where: {field1: "string"},
        limit: 5,
        offset: 0,
        order: [],
      },
      {
        fieldTransformation: {
            field1: (field1) => {
                if (field1 === "string") {
                    return {field1: "record 2 field 1"}
                }
                return { field1 }
            }
        }
      }
    )
    expect(count).toBe(1)
  })
})
