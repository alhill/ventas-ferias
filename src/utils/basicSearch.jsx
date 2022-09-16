
import { get } from 'lodash'
import cleanStr from './cleanStr'

const basicSearch = (str, arr, keys) => {
    return arr.filter(obj => {
        let incl = false
        for(let i=0; i < keys.length; i++){
            if(!str || cleanStr(get(obj, keys[i])).includes(cleanStr(str))){
                incl = true
                break
            }
        }
        return incl
    })
}

export default basicSearch