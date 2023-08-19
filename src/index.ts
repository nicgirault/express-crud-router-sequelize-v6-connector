import { Model, ModelStatic } from 'sequelize'

interface Actions<
  Attributes extends { id: string | number },
  CreationAttributes extends {} = Attributes
> {
  create: (
    body: CreationAttributes
  ) => Promise<Model<Attributes, CreationAttributes>>
  destroy: (id: Attributes['id']) => Promise<{ id: Attributes['id'] }>
  update: (
    id: Attributes['id'],
    data: Partial<Attributes>
  ) => Promise<Model<Attributes, CreationAttributes>>
  get: (conf: {
    filter: Record<string, any>
    limit: number
    offset: number
    order: Array<[string, string]>
  }) => Promise<{
    rows: Model<Attributes, CreationAttributes>[]
    count: number
  }>
}

const sequelizeCrud = <
  Attributes extends { id: string | number },
  CreationAttributes extends {} = Attributes
>(
  model: ModelStatic<Model<Attributes, CreationAttributes>>
): Actions<Attributes, CreationAttributes> => {
  return {
    create: body => model.create(body),
    update: async (id, body) => {
      const record = await model.findByPk(id)
      if (!record) {
        throw new Error('Record not found')
      }
      return record.update(body)
    },
    get: async ({ filter, limit, offset, order }) => {
      return model.findAndCountAll({
        limit,
        offset,
        order,
        where: filter,
        raw: true,
      })
    },
    destroy: async id => {
      const record = await model.findByPk(id)
      if (!record) {
        throw new Error('Record not found')
      }
      await record.destroy()
      return { id }
    },
  }
}

export default sequelizeCrud

export { simpleSequelizeSearch } from './searchList'
