import {Model, ModelStatic, WhereAttributeHash} from 'sequelize'
import { findAndCountAll } from './helpers'
import { sequelizeSearchFields } from './searchList'
export { sequelizeSearchFields }

interface Actions<
  Attributes extends { id: string | number },
  CreationAttributes extends {} = Attributes
> {
  getOne: (
    identifier: Attributes['id']
  ) => Promise<Model<Attributes, CreationAttributes> | null>
  create: (
    body: CreationAttributes
  ) => Promise<Model<Attributes, CreationAttributes>>
  destroy: (id: Attributes['id']) => Promise<{ id: Attributes['id'] }>
  update: (
    id: Attributes['id'],
    data: Partial<Attributes>
  ) => Promise<Model<Attributes, CreationAttributes>>
  getList: (conf: {
    filter: WhereAttributeHash<Attributes>
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
  model: ModelStatic<Model<Attributes, CreationAttributes>>,
  options?: { partialPagination?: boolean }
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
    getOne: async id => model.findByPk(id),
    getList: async ({ filter, limit, offset, order }) => {
      return findAndCountAll(
        model,
        { where: filter, limit, offset, order },
        options
      )
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
