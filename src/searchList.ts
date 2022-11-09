import {Op, WhereOptions, DataTypes, ModelStatic, Model, WhereAttributeHash} from 'sequelize'
import { findAndCountAll, FindAndCountOptions } from './helpers'

type ListOpts<Attributes> = {
  filter: WhereAttributeHash<Attributes>
  limit: number
  offset: number
  order: Array<[string, string]>
}

type FieldOpts<Attributes> = { field: keyof Attributes; comparator: symbol }

export const sequelizeSearchFields =
  <Attributes extends {}>(
    model: ModelStatic<Model<Attributes>>,
    searchableFields: (keyof Attributes | FieldOpts<Attributes>)[],
    options: FindAndCountOptions<Attributes> = {}
  ) =>
  async (q: string, listOpts: ListOpts<Attributes>) => {
    const query = prepareQuery<Attributes>(model, searchableFields)(q)
    const { filter = {}, limit, offset, order } = listOpts
    return findAndCountAll(
      model,
      {
        where: { ...query, ...filter },
        limit,
        offset,
        order,
      },
      options
    )
  }

const uuidRegExp = new RegExp(
  /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
)

const getCondition = (field: string, comparator: symbol, token: string) => {
  const isLike = comparator === Op.iLike || comparator === Op.like
  const isArrayComparator =
    comparator === Op.contains || comparator === Op.contained
  const condition = {
    [comparator]: isLike ? `%${token}%` : isArrayComparator ? [token] : token,
  }
  return {
    [String(field)]: condition,
  }
}

const getSearchTerm = <Attributes extends {}>(
  model: ModelStatic<Model<Attributes>>,
  field: keyof Attributes | FieldOpts<Attributes>,
  token: string
) => {
  const fieldName = (typeof field === 'object' ? field.field : field) as string
  const comparator = typeof field === 'object' ? field.comparator : Op.iLike
  if (String(model.rawAttributes[fieldName].type) === String(DataTypes.UUID)) {
    if (!uuidRegExp.test(token)) {
      return null
    }
    return getCondition(fieldName, Op.eq, token)
  }
  return getCondition(fieldName, comparator, token)
}

export const prepareQuery =
  <Attributes extends {}>(
    model: ModelStatic<Model<Attributes>>,
    searchableFields: (keyof Attributes | FieldOpts<Attributes>)[]
  ) =>
  (q: string): WhereOptions<Attributes> => {
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
        .map(field => getSearchTerm(model, field, token))
        .filter(Boolean)
    }

    const defaultConditions = getOrConditions(q)

    const tokens = q.split(/\s+/).filter(token => token !== '')
    const allTokens = [q, ...(tokens.length > 1 ? tokens : [])]
    if (tokens.length < 2)
      return {
        [Op.or]: defaultConditions,
      }

    // query consists of multiple tokens => do multiple searches
    return {
      [Op.or]: allTokens.map(token => ({
        [Op.or]: getOrConditions(token),
      })),
    }
  }
