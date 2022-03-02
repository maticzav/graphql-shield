import { IRoutes, GenerateRoutes } from '@guild-docs/server'

export function getRoutes(): IRoutes {
  const Routes: IRoutes = {
    _: {
      docs: {
        $name: 'Docs',
        $routes: ['README', 'getting-started', 'shield', 'rules'],
        _: {
          advanced: {
            $name: 'Advanced',
            $routes: ['whitelisting', 'reference', 'troubleshooting', 'reference', 'apollo-federation'],
          },
        },
      },
    },
  }

  GenerateRoutes({
    Routes,
    folderPattern: 'docs',
    basePath: 'docs',
    basePathLabel: 'Documentation',
    labels: {},
  })

  return Routes
}
