import { uniqBy, flatten } from 'lodash'
import { Op, WhereOptions, DataTypes, ModelStatic, Model } from 'sequelize'

export const sequelizeSearchFields =
  <Attributes extends {}>(
    model: ModelStatic<Model<Attributes>>,
    searchableFields: (keyof Attributes)[],
    comparator: symbol = Op.iLike
  ) =>
  async (q: string, limit: number, scope: WhereOptions<Attributes> = {}) => {
    const resultChunks = await Promise.all(
      prepareQueries<Attributes>(model, searchableFields)(q, comparator).map(
        query =>
          model.findAll({
            limit,
            where: { ...query, ...scope },
            raw: true,
          })
      )
    )

    const rows = uniqBy(flatten(resultChunks).slice(0, limit), 'id')

    return { rows, count: rows.length }
  }

const getSearchTerm = <Attributes extends {}>(
  model: ModelStatic<Model<Attributes>>,
  field: keyof Attributes,
  comparator: symbol,
  token: string
) => {
  if (
    String(model.rawAttributes[field as string].type) === String(DataTypes.UUID)
  ) {
    return { [Op.eq]: token }
  }
  return { [comparator]: `%${token}%` }
}

export const prepareQueries =
  <Attributes>(
    model: ModelStatic<Model<Attributes>>,
    searchableFields: (keyof Attributes)[]
  ) =>
  (q: string, comparator: symbol = Op.iLike): WhereOptions<Attributes>[] => {
    if (!searchableFields) {
      // TODO: we could propose a default behavior based on model rawAttributes
      // or (maybe better) based on existing indexes. This can be complexe
      // because we have to deal with column types
      throw new Error(
        'You must provide searchableFields option to use the "q" filter in express-sequelize-crud'
      )
    }

    const defaultQuery = {
      [Op.or]: searchableFields.map(field => ({
        [field]: getSearchTerm(model, field, comparator, q),
      })),
    }

    const tokens = q.split(/\s+/).filter(token => token !== '')
    if (tokens.length < 2) return [defaultQuery]

    // query consists of multiple tokens => do multiple searches
    return [
      // priority to unsplit match
      defaultQuery,

      // then search records with all tokens
      {
        [Op.and]: tokens.map(token => ({
          [Op.or]: searchableFields.map(field => ({
            [field]: getSearchTerm(model, field, comparator, token),
          })),
        })),
      },

      // then search records with at least one token
      {
        [Op.or]: tokens.map(token => ({
          [Op.or]: searchableFields.map(field => ({
            [field]: getSearchTerm(model, field, comparator, token),
          })),
        })),
      },
    ]
  }
