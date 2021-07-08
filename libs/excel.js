var xl = require('excel4node');

module.exports.exportExcel = function(data, filePath, processed, callback) {
// Create a new instance of a Workbook class
    var wb = new xl.Workbook();

// Add Worksheets to the workbook
    var ws = wb.addWorksheet('Mail');
    var headerStyle = wb.createStyle({
        font: {
            bold: true,
            underline: true,
        },
        alignment: {
            wrapText: true,
            horizontal: 'center',
        },
    });

    ws.column(1).setWidth(40);
    ws.column(2).setWidth(20);
    ws.column(3).setWidth(40);
    ws.column(4).setWidth(100);


    ws.cell(1, 1).string('Email').style(headerStyle)
    ws.cell(1, 2).string('Password').style(headerStyle)
    ws.cell(1, 3).string('Email Recovery').style(headerStyle)
    ws.cell(1, 4).string('Youtube Channel').style(headerStyle)

    var startCell = 2;
    data.forEach(function(d) {
        if(processed == 1) {
            ws.cell(startCell, 1).string(d.email)
            ws.cell(startCell, 2).string(d.new_password)
            ws.cell(startCell, 3).string(d.new_email_recovery)
            ws.cell(startCell, 4).string(d.youtube_channel)
        }else {
            ws.cell(startCell, 1).string(d.email)
            ws.cell(startCell, 2).string(d.password)
        }
        startCell ++
    })
    wb.write(filePath, callback)
}

const excelToJson = require('convert-excel-to-json');

module.exports.parserOrders = function(uid, file, callback) {
    try {
        const result = excelToJson({
            sourceFile: file,
            header:{
                rows: 1
            },
            sheets : ["Sheet1"],
            columnToKey: {
                A: 'service_id',
                B: 'quality',
                C: 'link',
                D: 'keyword'
            }
        });
        // let arr = []
        // result.Sheet1.forEach(function(r) {
        //     let row = []
        //     row.push(uid)
        //     let sid = parseInt(r.service_id)
        //     let q = parseInt(r.quality)
        //     if(!isNaN(sid) && !isNaN(q) && r.link != undefined) {
        //         row.push(sid)
        //         row.push(q)
        //         row.push(r.link)
        //         row.push(r.keyword)
        //         arr.push(row)
        //     }
        // })
        if(result.Sheet1 == undefined) {
            callback("File không đúng định dạng. Hãy download file mẫu về sửa")
            return
        }
        callback(undefined, result.Sheet1)
    }catch (e) {
        callback("EXCEPTION " + e.toString())
    }
}