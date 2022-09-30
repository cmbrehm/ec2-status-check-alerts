import { statusOK } from '../index'
import { equal } from 'assert'

describe("status-is-ok", ()=> {
  it("should ignore ok",()=>{
    equal(true, statusOK({Status:"ok"}))
  })
  it("should ignore initializing",()=>{
    equal(true, statusOK({Status:"initializing"}))
  })
  it("should alert anything else",()=>{
    equal(true, statusOK({Status:"bad"}))
  })
})
