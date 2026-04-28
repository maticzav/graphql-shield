module.exports = {
    // eslint-disable-next-line global-require
    ...require('@siteminder/testing/node/jest.config'),
    testMatch: [
        '<rootDir>/tests/**/*.spec.(js|ts)',
    ],
    moduleNameMapper: {
        '^(\\..+)\\.js$': '$1',
        '^graphql$': '<rootDir>/node_modules/graphql',
        '^graphql/(.*)': '<rootDir>/node_modules/graphql/$1',
        '^graphql-middleware$': '<rootDir>/node_modules/graphql-middleware',
        '^graphql-middleware/(.*)': '<rootDir>/node_modules/graphql-middleware/$1',
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {}],
    },
}
