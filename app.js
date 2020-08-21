const csvParser = require('csv-parser')
const fs = require('fs')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'out.csv',
  header: [
    {id: 'value', title: 'value'},
    // {id: 'surname', title: 'Surname'},
    // {id: 'age', title: 'Age'},
    // {id: 'gender', title: 'Gender'},
  ]
});

const filepath = './qph-1.csv'
const file2path = './qph-2.csv'
const file3path = './qph-3.csv'
const file4path = './qph-4.csv'
const file5path = './qph-5.csv'
const cadFilePath = './qph-cad.csv'
const results = []
const cadResult = []
const storeData = []
fs.createReadStream(cadFilePath)
.on('error',()=>{
    console.log('read cad file error')
})
.pipe(csvParser())
.on('data',row=>{
    cadResult.push(row)
})
.on('end',()=>{
                 fs.createReadStream(filepath)
                    .on('error',()=>{
                    console.log('error occurred')
                    })
                    .pipe(csvParser())
                    .on('data', row =>{
                     results.push(row)
                    })
                    .on('end', ()=>{
                    results.forEach( data =>  storeData.push(generateRawDataObject(data)))
                    const c0402 = storeData.filter(item => item.package === "C0402").map(item => item.rawData)
                    const gatherData = []
                  
                    c0402.forEach(
                        arr =>{
                           // const avg = arr.reduce((acc,element) => acc + element.height,0)/arr.length
                           arr.forEach(element =>
                                gatherData.push({value: parseFloat(element.height.toFixed(4))})
                            )
                        }
                    )
                    
                    
                    //  const c0402VolumeMean = c0402.reduce((acc,ele) => acc + ele,0)/c0402.length
                   // console.log(parseFloat(gatherData.reduce((acc,ele)=>acc + ele,0)/gatherData.length).toFixed(4))
                    //    console.log(gatherData)     
                    csvWriter
                    .writeRecords(gatherData)
                    .then(()=> console.log('The CSV file was written successfully'));
                       // here to insert data into Mongodb 
                       // insert 30291 rows into db one by one
                       // data structure
                       // { id, package, deviceType, designator, pin, rawData:[{barcode,volume,area,height} ...]  }
                       // use express server to provide api to handle the query instruction
                       // query: Product: default X11QPH+
                       //        Package: default C0402
                       //        Component: default All
                       //        Pin: default All
                       // dispatch package === C0402 rows, [ { id, package, deviceType, designator, pin, rawData:[{barcode,volume,area,height} ...]  } ...]
   
                    })
})

const generateRawDataObject = data =>{
    const rawData = []
    const designator = data['Component ID']
    const removeUnderlineDesignator = designator.split('_')[0]
    const pin = data['PAD ID']
    const cadObj = cadResult.find(element => element.REFDES.includes(removeUnderlineDesignator))
    const { COMP_PACKAGE:package,COMP_DEVICE_TYPE:deviceType} = cadObj
    const keys = Object.keys(data)
    let o = {barcode:undefined,volume:undefined,area:undefined,height:undefined}
            for(let i = 0; i < keys.length; i++){
                
                if(keys[i].includes('Barcode')){
                    o.barcode = data[keys[i]]
                }
                if(keys[i].includes('Volume(mm)')){
                    o.volume = parseFloatToFixedFour(data[keys[i]])
                }
                if(keys[i].includes('Area(mm)')){
                    o.area = parseFloatToFixedFour(data[keys[i]])
                }
                if(keys[i].includes('Height(mm)')){
                    o.height = parseFloatToFixedFour(data[keys[i]])
                }
                if(keys[i].includes('OffsetY(%)')){
                    rawData.push(o)
                    o = {barcode:undefined,volume:undefined,area:undefined,height:undefined}
                }            
            }
     return { package,deviceType,designator,pin,rawData}
 
}

const parseFloatToFixedFour = str => parseFloat(parseFloat(str).toFixed(4))