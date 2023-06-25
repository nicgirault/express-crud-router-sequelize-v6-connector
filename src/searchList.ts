import { Op, DataTypes, ModelStatic, Model, WhereOptions } from 'sequelize'

export const simpleSequelizeSearch =
  <Attributes extends {}>(
    model: ModelStatic<Model<Attributes>>,
    searchableFields: (keyof Attributes)[],
    comparator: symbol = Op.iLike
  ) => (q: string): WhereOptions<Attributes> => ({
    [Op.or]: searchableFields.map(field => ({
      [field]: getSearchTerm(model, field, comparator, q),
    })),
  })

const getSearchTerm = <Attributes extends {}>(
  model: ModelStatic<Model<Attributes>>,
  field: keyof Attributes,
  comparator: symbol,
  query: string
) => {
  if (
    String(model.rawAttributes[field as string].type) === String(DataTypes.UUID)
  ) {
    return { [Op.eq]: query }
  }
  return { [comparator]: `%${query}%` }
}
