import { get } from 'lodash'

const basicSorter = (a, b, key) => {
    const aValue = key ? get(a, key) : a
    const bValue = key ? get(b, key) : b
    if(aValue > bValue){ return 1 }
    else{ return -1 }
}

export default basicSorter