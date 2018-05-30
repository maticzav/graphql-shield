# GraphQL Shield Advanced Example

> This application is made solely for the purpose of Shield demonstration.

- Powered by [Prisma](https://www.prisma.io).
- Simple Groceries shop.
- Don't spend too much money!

## Running the server

```bash
yarn
yarn dev
```

## Sample Queries

Test the functionality of this application. You can authenticate users by adding `Authorization: Bearer <token>` as your http header. (NOTE: This is not how authentication should be done!)

### Customer

#### Predefined Emails

- use johnny@shield.com,
- or mathew@shield.com

```gql
query Johnny {
  viewer {
    email
    basket {
      id
      quantity
      product {
        name
      }
    }
  }
}

query Catalog {
  products {
    id
    name
    price
  }
}

mutation AddToBasket($ID: ID!) {
  addItemToBasket(productId: $ID, quantity: 2) {
    basket {
      quantity
      product {
        name
      }
    }
  }
}

mutation RemoveItemFromBasket($ID: ID!) {
  removeItemFromBasket(itemId: $ID) {
    basket {
      quantity
      product {
        name
      }
    }
  }
}
```

### Grocer

#### Available Emails

- use maya@shield.com

```gql
query Supply {
  products {
    id
    name
  }
}

mutation AddProduct($name: String!, $description: String!, $price: Int!) {
  addProduct(name: $name, description: $description, price: $price) {
    id
    name
  }
}

mutation DeleteProduct($id: ID!) {
  removeProduct(id: $id) {
    id
    name
  }
}
```

## License

MIT @ Matic Zavadlal
