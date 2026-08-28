import type { BoxProps } from '../../components/common/Box'

type SkeletonCircleProps = {
  size?: string
} & BoxProps

type SkeletonTextProps = {
  noOfLines?: number
  gap?: string
} & BoxProps

type SkeletonBoxProps = {
  loading?: boolean
} & BoxProps

export type { SkeletonBoxProps, SkeletonCircleProps, SkeletonTextProps }
