interface R<T = any> {
  status: number
  code: number
  msg: string
  data: T
}

interface List<T = any> {
  list: T[]
  total: number
}
