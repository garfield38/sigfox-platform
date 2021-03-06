import {Model} from '@mean-expert/model';
import * as _ from 'lodash';

const moment = require('moment');
const request = require('request');

/**
 * @module Device
 * @description
 * Write a useful Device Model description.
 * Register hooks and remote methods within the
 * Model Decorator
 **/
@Model({
  hooks: {
    beforeSave: {name: 'before save', type: 'operation'}/*,
    access: {name: 'access', type: 'operation'}*/
  },
  remotes: {
    myRemote: {
      returns: {arg: 'result', type: 'array'},
      http: {path: '/my-remote', verb: 'get'}
    },
    timeSeries: {
      accepts: [
        {arg: 'deviceId', type: 'string', required: true, description: 'the deviceId'},
        {
          arg: 'dateBegin',
          type: 'string',
          default: moment().subtract(1, 'hours'),
          description: 'the starting date-time'
        },
        {arg: 'dateEnd', type: 'string', default: moment(), description: 'the ending date-time'}
      ],
      returns: {arg: 'result', type: 'array'},
      http: {path: '/time-series', verb: 'get'}
    },
    deleteDeviceAndMessages: {
      accepts: [
        {arg: 'deviceId', type: 'string', required: true},
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      http: {
        path: '/Messages',
        verb: 'delete'
      },
      returns: {root: true}
    },
    getMessagesFromSigfoxBackend: {
      accepts: [
        {arg: 'id', type: 'string', required: true, description: 'Device Id'},
        {arg: 'limit', type: 'number', required: false, description: 'Limit retrieved messages (max 100)'},
        {arg: 'before', type: 'number', description: 'Before'},
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      http: {
        path: '/:id/messages-from-sigfox-backend',
        verb: 'get'
      },
      returns: {type: [], root: true}
    },
    parseAllMessages: {
      accepts: [
        {arg: 'id', type: 'string', required: true, description: 'Device Id'},
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      http: {
        path: '/:id/parse-messages',
        verb: 'put'
      },
      returns: {type: [], root: true}
    }
  }
})

class Device {

  private sigfoxBackendBaseApiUrl = 'https://backend.sigfox.com/api/';

  // LoopBack model instance is injected in constructor
  constructor(public model: any) {
  }

  deleteDeviceAndMessages(deviceId: string, req: any, next: Function): void {
    // Obtain the userId with the access_token of ctx
    const userId = req.accessToken.userId;
    // Find device
    this.model.findOne(
      {
        where: {
          and: [
            {id: deviceId},
            {userId: userId}
          ]
        }
      }, (err: any, deviceInstance: any) => {
        if (err || !deviceInstance) {
          console.error('Device not found for suppression.');
          next(err, 'Device not found for suppression.');
        } else if (deviceInstance) {
          console.log('Deleting device ' + deviceId + ' and all its corresponding messages.');

          this.model.app.models.Message.destroyAll({deviceId: deviceId}, (err: any, result: any) => {
            if (!err) {
              this.model.destroyById(deviceId, (error: any, result: any) => {
                next(null, result);
              });
            } else {
              next(err, 'Error for messages suppression with device ID ' + deviceId);
            }
          });
        }
      });
  }

  // Example Operation Hook
  beforeSave(ctx: any, next: Function): void {
    console.log('Device: Before Save');
    next();
  }

  // Example Remote Method
  myRemote(next: Function): void {
    this.model.find(next);
  }


  timeSeries(deviceId: string, dateBegin: string, dateEnd: string, next: Function): void {

    const result: any = {
      xAxis: [],
      yAxis: []
    };

    let messages: any;

    const arrayOfObject: Array<any> = [];

    this.model.app.models.Device.findById(
      deviceId,
      {
        include: [
          {
            relation: 'Messages',
            scope: {
              // fields: ['data_parsed'],
              where: {
                and: [
                  {createdAt: {gte: dateBegin}},
                  {createdAt: {lte: dateEnd}},
                  {data_parsed: {neq: null}}
                ]
              },
              order: 'createdAt ASC'
            }
          }]
      },
      (err: any, device: any) => {
        if (err || !device) {
          console.log(err);
        } else {
          // console.log("device:", device);
          device = device.toJSON();

          messages = device.Messages;
          // console.log("messages", messages.length);

          messages.forEach((message: any, messageIndex: number) => {
            if (message.data_parsed) {
              result.xAxis.push(message.createdAt);
              message.data_parsed.forEach((data: any, dataIndex: number) => {
                data.timestamp = message.createdAt;
                arrayOfObject.push(data);

                // console.log(data.key);
              });
            }
          });

          result.yAxis = _.groupBy(arrayOfObject, 'key');
          // groupByKey = _.groupBy(arrayOfObject, "key");
          // console.log(groupByKey);

          // for (var key in groupByKey) {
          //   let obj: any;
          //   obj = {
          //     label: "",
          //     data: []
          //   };
          //   let info: any;
          //   info = {
          //     property: "",
          //     type: "",
          //     unit: ""
          //   };
          //   // check also if property is not inherited from prototype
          //   if (groupByKey.hasOwnProperty(key)) {
          //     obj.label = key;
          //     info.property = key;
          //     groupByKey[key].forEach((item: any) => {
          //       obj.data.push(item.value);
          //       info.type = item.type;
          //       info.unit = item.unit;
          //     });
          //
          //     result.yAxis.push(obj);
          //     result.info.push(info);
          //   }
          // }


          // result.yAxis = _.groupBy(result.yAxis, "key");


        }
        next(err, result);
      });
  }

  getMessagesFromSigfoxBackend(deviceId: string, limit: number, before: number, req: any, next: Function): void {
    const userId = req.accessToken.userId;

    if (!limit) {
      limit = 100;
    }

    this.model.app.models.Connector.findOne(
      {
        where: {
          userId: userId,
          name: 'sigfox-api'
        }
      },
      (err: any, connector: any) => {
        if (err) {
          console.log(err);
          next(err, null);
        } else {
          console.log(connector);
          if (connector) {
            const sigfoxApiLogin = connector.login;
            const sigfoxApiPassword = connector.password;


            // let messages: any[] = [];
            let message: any;
            let reception: any[] = [];
            let geoloc: any[] = [];

            const credentials = new Buffer(sigfoxApiLogin + ':' + sigfoxApiPassword).toString('base64');


            this.model.app.dataSources.sigfox.getMessages(
              credentials,
              deviceId,
              (limit < 100) ? limit : 100,
              before ? before : new Date()
            ).then((result: any) => {
              // console.log("Length: ", result.data.length);
              // console.log("Next: ", result.paging.next);
              result.data.forEach((messageInstance: any) => {

                reception = [];
                messageInstance.rinfos.forEach((o: any) => {
                  const rinfo: any = {
                    id: o.tap,
                    lat: o.lat,
                    lng: o.lng,
                    RSSI: o.rssi,
                    SNR: o.snr
                  };
                  reception.push(rinfo);
                });
                if (messageInstance.computedLocation) {
                  geoloc = [{
                    type: 'sigfox',
                    lat: messageInstance.computedLocation.lat,
                    lng: messageInstance.computedLocation.lng,
                    precision: messageInstance.computedLocation.radius,
                    createdAt: new Date(messageInstance.time * 1000)
                  }];
                }

                message = {
                  userId: userId,
                  deviceId: messageInstance.device,
                  time: messageInstance.time,
                  seqNumber: messageInstance.seqNumber,
                  data: messageInstance.data,
                  reception: reception,
                  geoloc: geoloc,
                  createdAt: new Date(messageInstance.time * 1000),
                  updatedAt: new Date(messageInstance.time * 1000),
                };
                this.model.app.models.Message.findOrCreate(
                  {
                    where: {
                      and: [
                        {deviceId: message.deviceId},
                        {time: message.time},
                        {seqNumber: message.seqNumber}
                      ]
                    }
                  },
                  message,
                  (err: any, messagePostProcess: any, created: boolean) => { // callback
                    if (err) {
                      console.log(err);
                      // next(err, err);
                    } else {
                      if (created) {
                        console.log('Created new message.');
                      } else {
                        console.log('Found an existing message: ');
                      }
                    }
                  });

                message = {};

              });

              next(null, result);
            }).catch((err: any) => {
              next(err, null);
            });

          } else {
            next(err, 'Please refer your Sigfox API connector first');
          }
        }
      });
  }

  parseAllMessages(deviceId: string, req: any, next: Function): void {
    const userId = req.accessToken.userId;

    const Device = this.model.app.models.Device;
    const Parser = this.model.app.models.Parser;
    const Message = this.model.app.models.Message;
    let loop = 0;

    const response: any = {};

    if (!userId) {
      response.message = 'Please login or use a valid access token';
      next(null, response);
    }

    Device.findById(deviceId, {include: 'Messages'}, function (err: any, device: any) {

      if (err) {
        next(err, null);
      } else {
        device = device.toJSON();
        // console.log(device);
        if (!device.ParserId || !device.parserId) {
          response.message = 'No parser associated to this device';
          next(null, response);
        } else {
          // console.log(device.Messages);
          if (device.Messages) {
            device.Messages.forEach((message: any) => {
              if (message.data) {
                Parser.parsePayload(device.parserId, message.data, req, function (err: any, data_parsed: any) {
                  if (err) {
                    next(err, null);
                  } else {
                    loop++;
                    // console.log(data_parsed);
                    const geoloc: any = {};
                    if (data_parsed) {

                      message.data_parsed = data_parsed;
                      message.data_parsed.forEach((o: any) => {
                        // Check if there is geoloc in parsed data
                        if (o.key === 'geoloc') {
                          geoloc.type = o.value;
                        } else if (o.key === 'lat') {
                          geoloc.lat = o.value;
                        } else if (o.key === 'lng') {
                          geoloc.lng = o.value;
                        } else if (o.key === 'precision') {
                          geoloc.precision = o.value;
                        }
                      });
                      if (geoloc.type) {
                        let addGeoloc: boolean = true;
                        if (!message.geoloc) {
                          message.geoloc = [];
                        }else{
                          message.geoloc.forEach((geo:any)=>{
                            if(geo.type == geoloc.type){
                              addGeoloc = false;
                            }
                          });

                          if(addGeoloc){
                            message.geoloc.push(geoloc);
                          }
                        }

                      }
                      Message.upsert(message, function(err: any, messageUpdated: any){
                        console.log(messageUpdated);
                      });
                    }
                    if (loop === device.Messages.length) {
                      response.message = 'Success';
                      next(null, response);
                    }
                  }
                });
              }
            });
          } else {
            response.message = 'This device has no messages';
            next(null, response);
          }

        }
      }


    });

  }


}

module.exports = Device;
