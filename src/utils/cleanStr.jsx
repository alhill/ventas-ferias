import { deburr } from 'lodash'

const cleanStr = str => deburr((str || "").toLocaleLowerCase())

export default cleanStr