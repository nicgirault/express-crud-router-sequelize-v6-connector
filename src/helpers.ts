import {Model, ModelStatic, WhereAttributeHash, WhereValue} from 'sequelize'

export type FindAndCountOptions<Attributes extends {}> = {
  partialPagination?: boolean,
  fieldTransformation?: Record<keyof Attributes, (value: WhereValue<Attributes> | undefined) => WhereAttributeHash<Attributes>>,
}

export const findAndCountAll = async <
  Attributes extends {},
  CreationAttributes extends {} = Attributes
>(
  model: ModelStatic<Model<Attributes, CreationAttributes>>,
  conf: {
    where: WhereAttributeHash<Attributes>
    limit: number
    offset: number
    order: Array<[string, string]>
  },
  options: FindAndCountOptions<Attributes> = {}
) => {
  const { partialPagination } = options
  const { where, limit, offset, order } = conf

  let whereOverrides: WhereAttributeHash<Attributes> = {}
  if (options.fieldTransformation) {
    for (const field in where) {
      if (options.fieldTransformation[field]) {
        whereOverrides = {...whereOverrides, ...(options.fieldTransformation[field](where[field] as WhereValue<Attributes>))}
      }
    }
  }

  if (!partialPagination) {
    return model.findAndCountAll({
      limit,
      offset,
      order,
      where: {...where, ...whereOverrides},
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
