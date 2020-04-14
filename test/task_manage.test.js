
class obj1 {

}

class obj2 {

}

describe('crypto test', () => {
    test('test type assert', () => {
        // let o1 = new obj1()
        let o1
        // o1.name = "123"
        // let o2 = new obj2()
        // console.log('check', o2 instanceof obj2, o1 instanceof obj1, o1 instanceof obj2)
        // console.log("o1.name", o1.name, o2.name)
        switch (o1.constructor) {
            case obj2:
                console.log('obj2')
                break;
            case obj1:
                console.log('obj1')
                break;
            default:
                console.log("default")
        }
    });
})
