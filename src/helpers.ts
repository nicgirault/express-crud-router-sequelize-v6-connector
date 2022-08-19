import { Model, ModelStatic, WhereOptions } from 'sequelize'

export const findAndCountAll = async <
  Attributes extends {},
  CreationAttributes extends {} = Attributes
>(
  model: ModelStatic<Model<Attributes, CreationAttributes>>,
  conf: {
    where: WhereOptions<Attributes>
    limit: number
    offset: number
    order: Array<[string, string]>
  },
  options: { partialPagination?: boolean } = {}
) => {
  const { partialPagination } = options
  const { where, limit, offset, order } = conf

  if (!partialPagination) {
    return model.findAndCountAll({
      limit,
      offset,
      order,
      where,
      raw: true,
    })
  }
  const findAllResult = await model.findAll({
    limit: limit + 1,
    offset,
    order,
    where,
    raw: true,
  })

  return {
    rows: findAllResult.slice(0, limit),
    count: offset + findAllResult.length,
  }
}
