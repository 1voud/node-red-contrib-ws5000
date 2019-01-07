module.exports = function(RED) {

var HID = require('node-hid');

var station;

    function Ws5000Node(config) {
        RED.nodes.createNode(this,config);
        var node = this;

	var devices = HID.devices();
      //var device = null;
        for(var d in devices) {
            if(devices[d].vendorId === 0x1941 && devices[d].productId === 0x8021) {
                   station = new HID.HID(devices[d].path);
            }
        }
        if (station == null) {
            console.log('cannot open HID Device');
        }

        node.on("close", function() {
		station.removeAllListeners('data');
		station.write([0xA1, 0, 10, 0x20,0xA1, 0, 10, 0x20]);
		station.close();
		console.log('closed');
	});

        node.on('input', function(msg) {
                // station.write([0xA1, 0, 0, 0x20,0xA1, 0, 0, 0x20]);
                var _chunk = function (data) {
			if (typeof b == 'undefined' || b == null) {
			  b = Buffer.from(data);
			} else {
			  b = Buffer.concat([b, Buffer.from(data)]);
			}
			if (b.length == 32) {
			  address = b.readInt16LE(30);
			  var hi = Math.floor(address/256), lo = address%256;
			  station.write([0xA1, hi, lo, 0x20,0xA1, hi, lo, 0x20]);
			}
			if (b.length == 64) {
				console.log(b.slice(0, 32));
				b = b.slice(32);
                		console.log(b);
				console.log(b.readInt8(1));
				console.log(b.readInt16LE(2));
       		         	var msg={};
               		 	msg.payload = {};
				msg.payload.humidity_indoor = b.readUInt8(1);
				msg.payload.temperatur_indoor = b.readInt16LE(2);
               		        msg.payload.humidity_outdoor = b.readUInt8(4);
                        	msg.payload.temperatur_outdoor = b.readInt16LE(5);
				msg.payload.abs_pressure = b.readUInt16LE(7);

                        	msg.payload.wind_dir = b.readUInt8(12);
				msg.payload.rain = b.readUInt16LE(13);

				var lo = b.readUInt8(9);
				var hi = b.readUInt8(11)&0x0f;
				var res = hi<<8;
				res += lo;
				msg.payload.wind_ave = res;

				lo = b.readUInt8(10);
                        	hi = b.readUInt8(11)&0xf0;
                        	res = hi<<4;
				res += lo;
                        	msg.payload.wind_gust = res;

				var b1 = Buffer.from([b.readUInt8(16), b.readUInt8(17), b.readUInt8(18), 0x00]);
                       		msg.payload.light = b1.readInt32LE(0);
				msg.payload.uv = b.readUInt8(19);
                        	node.send(msg);

				b = null;
				station.removeAllListeners('data');
//				station.write([0xA1, 0, 10, 0x20,0xA1, 0, 10, 0x20]);
//				station.close();
			} 
                };
                // make sure all listeners removed, before binding new local function
                station.removeAllListeners('data');
                station.on('data',_chunk);
		station.write([0xA1, 0, 0, 0x20,0xA1, 0, 0, 0x20]);
        });
    }
    RED.nodes.registerType("ws5000",Ws5000Node);
}

