import { Tab, Tabs, TabList, TabPanels, TabPanel, TabsProps, Code, useColorModeValue } from '@chakra-ui/react'
import create from 'zustand'
import { persist } from 'zustand/middleware'
import { CopyToClipboard } from './CopyToClipboard'
import { useMemo, useState, useEffect } from 'react'

enum PackageManagerType {
  PNPM = 0,
  YARN = 1,
  NPM = 2,
}

const useCurrentInstaller = create<{
  current: PackageManagerType
  setPNPM: () => void
  setYarn: () => void
  setNPM: () => void
}>(
  persist(
    (set) => {
      return {
        current: PackageManagerType.YARN,
        setPNPM: () =>
          set({
            current: PackageManagerType.PNPM,
          }),
        setYarn: () =>
          set({
            current: PackageManagerType.YARN,
          }),
        setNPM: () =>
          set({
            current: PackageManagerType.NPM,
          }),
      }
    },
    {
      name: 'PackageManager',
    },
  ),
)

export function PackageInstall({ packageName, ...props }: { packageName: string } & Omit<TabsProps, 'children'>) {
  const { current, setNPM, setPNPM, setYarn } = useCurrentInstaller()

  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(current)
  }, [current])

  const currentContent = useMemo(() => {
    switch (current) {
      case PackageManagerType.PNPM:
        return `pnpm add ${packageName}`
      case PackageManagerType.YARN:
        return `yarn add ${packageName}`
      case PackageManagerType.NPM:
        return `npm install ${packageName}`
    }
  }, [current])

  const panelBgColor = useColorModeValue('gray.100', undefined)

  return (
    <Tabs
      width="100%"
      position="relative"
      shadow="md"
      borderWidth="1px"
      borderRadius="5px"
      index={index}
      onChange={(index) => {
        switch (index) {
          case PackageManagerType.PNPM:
            return setPNPM()
          case PackageManagerType.YARN:
            return setYarn()
          case PackageManagerType.NPM:
            return setNPM()
        }
      }}
      {...props}
    >
      <TabList>
        <Tab>yarn</Tab>
        <Tab>pnpm</Tab>
        <Tab>npm</Tab>
      </TabList>
      <TabPanels>
        <TabPanel backgroundColor={panelBgColor}>
          <Code>yarn add {packageName}</Code>
        </TabPanel>
        <TabPanel backgroundColor={panelBgColor}>
          <Code>pnpm add {packageName}</Code>
        </TabPanel>
        <TabPanel backgroundColor={panelBgColor}>
          <Code>npm install {packageName}</Code>
        </TabPanel>
      </TabPanels>
      <CopyToClipboard value={currentContent} />
    </Tabs>
  )
}
