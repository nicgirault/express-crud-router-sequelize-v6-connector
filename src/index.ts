import { Model, BuildOptions, ModelStatic } from 'sequelize'

type GetOne<R> = (identifier: string) => Promise<R | null>
type Create<I extends string | number, R> = (body: R) => Promise<R & { id: I }>
type Destroy = (id: string) => Promise<any>
type Update<R> = (id: string, data: R) => Promise<any>
type GetList<R> = (conf: {
  filter: Record<string, any>
  limit: number
  offset: number
  order: Array<[string, string]>
}) => Promise<{ rows: R[]; count: number }>

interface Actions<I extends string | number, R> {
  getOne: GetOne<R> | null
  create: Create<I, R> | null
  destroy: Destroy | null
  update: Update<R> | null
  getList: GetList<R> | null
}

const sequelizeCrud = <I extends string | number, R extends Model>(
  model: ModelStatic<R>
): Actions<I, R> => {
  return {
    create: body => model.create(body) as any,
    update: async (id, body) => {
      const record = await model.findByPk(id)
      if (!record) {
        throw new Error('Record not found')
      }
      return record.update(body)
    },
    getOne: async id => model.findByPk(id),
    getList: async ({ filter, limit, offset, order }) => {
      return model.findAndCountAll({
        limit,
        offset,
        order,
        where: filter as any,
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
