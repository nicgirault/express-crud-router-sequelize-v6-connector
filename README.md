# express-crud-router-sequelize-v6-connector

Sequelize v6 connector to [express-crud-router](https://github.com/nicgirault/express-crud-router).

```ts
import crud from 'express-crud-router'
import sequelizeV6Crud from 'express-crud-router-sequelize-v6-router'

app.use(crud('/admin/users', sequelizeV6Crud(User)))
```

## Install

```
npm install express-crud-router-sequelize-v6-router
```

## Search

express-crud-router-sequelize-v6-router exposes a default search helper function `sequelizeSearchFields`.

Here is an example:

```ts
import crud from 'express-crud-router'
import sequelizeCrud, {
  simpleSequelizeSearch,
} from 'express-crud-router-sequelize-v6-connector'

crud('/admin/users', sequelizeCrud(User), {
  filters: {
    q: simpleSequelizeSearch(User, ['address', 'zipCode', 'city']),
  },
})
```

When searching `some stuff`, records with a searchable field that contains `some stuff` will be returned.

The search is case insensitive by default (except for search fields of type `DataTypes.UUID` where exact matches are returned). You can customize the search to make it case sensitive:

```ts
import { Op } from 'sequelize'

const search = simpleSequelizeSearch(
  User,
  ['address', 'zipCode', 'city'],
  Op.like
)
```

## Contribute

See https://github.com/nicgirault/express-crud-router#contribute
