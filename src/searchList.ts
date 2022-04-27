import { Op, WhereOptions, DataTypes, ModelStatic, Model } from 'sequelize'
type ListOpts<Attributes> = {
  filter: WhereOptions<Attributes>
  limit: number
  offset: number
  order: Array<[string, string]>
}
export const sequelizeSearchFields =
  <Attributes extends {}>(
    model: ModelStatic<Model<Attributes>>,
    searchableFields: (keyof Attributes)[],
    comparator: symbol = Op.iLike
  ) =>
  async (q: string, listOpts: ListOpts<Attributes>) => {
    const query = prepareQuery<Attributes>(model, searchableFields)(q, comparator)
    const {filter = {}, limit, offset, order} = listOpts
    return model.findAndCountAll({
      limit,
      offset,
      order,
      where: { ...query, ...filter },
      raw: true,
    })
  }

  const uuidRegExp = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);

const getSearchTerm = <Attributes extends {}>(
  model: ModelStatic<Model<Attributes>>,
  field: keyof Attributes,
  comparator: symbol,
  token: string
) => {
  if (
    String(model.rawAttributes[field as string].type) === String(DataTypes.UUID)
  ) {
    if (!uuidRegExp.test(token)) {
      return null
    }
    return { [Op.eq]: token }
  }
  return { [comparator]: `%${token}%` }
}

export const prepareQuery =
  <Attributes>(
    model: ModelStatic<Model<Attributes>>,
    searchableFields: (keyof Attributes)[]
  ) =>
  (q: string, comparator: symbol = Op.iLike): WhereOptions<Attributes> => {
    if (!searchableFields) {
      // TODO: we could propose a default behavior based on model rawAttributes
      // or (maybe better) based on existing indexes. This can be complexe
      // because we have to deal with column types
      throw new Error(
        'You must provide searchableFields option to use the "q" filter in express-sequelize-crud'
      )
    }

    const getOrConditions = (token: string) => {
      return searchableFields
          .map(field => [field, getSearchTerm(model, field, comparator, token)])
          .filter(([, condition]) => Boolean(condition))
          .map(([field, condition]) => ({
            [String(field)]: condition,
          }))
    }

    const defaultConditions = getOrConditions(q)

    const tokens = q.split(/\s+/).filter(token => token !== '')
    const allTokens = [q, ...(tokens.length > 1 ? tokens : [])]
    if (tokens.length < 2) return {
      [Op.or]: defaultConditions,
    }

    // query consists of multiple tokens => do multiple searches
    return {
      [Op.or]: allTokens.map(token => ({
        [Op.or]: getOrConditions(token),
      })),
    }
  }
