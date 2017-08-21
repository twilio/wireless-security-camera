const SNAPSHOT_PATTERN = /^cameras.([a-zA-Z0-9]+).snapshot$/

exports.handler = function(context, event, callback) {
    if ("document_updated" === event.EventType &&
        event.DocumentUniqueName.match(SNAPSHOT_PATTERN)) {
        let cameraId = SNAPSHOT_PATTERN.exec(event.DocumentUniqueName)[1];
        let camera_control_map = "cameras." + cameraId + ".control";
        let camera_alerts_list = "cameras." + cameraId + ".alerts";
        
        let snapshotData = JSON.parse(event.DocumentData);
        let config;

        if (snapshotData.traits && snapshotData.traits.changes_detected) {
            let client = context.getTwilioClient();
            let syncService = client.sync.services(context.SERVICE_SID);
            Promise.all([
                syncService.syncMaps(camera_control_map).syncMapItems("alarm").fetch(),
                syncService.syncMaps(camera_control_map).syncMapItems("arm").fetch(),
                syncService.documents("app.configuration").fetch()                
            ])
            .then(function (items) {
                let alarmItem = items[0];
                let armItem = items[1];
                config = items[2].data;

                let disarmed = alarmItem.data.id === armItem.data.responded_alarm;
                
                if (disarmed) {
                    // raise new alarm
                    return Promise.all([
                        alarmItem.data.id,
                        syncService
                        .syncLists(camera_alerts_list)
                        .syncListItems.create({
                            data: {
                                datetime_utc: (new Date()).getTime(),
                                reason: "changes_detected"
                            }
                        })
                    ]);
                } else {
                    return [alarmItem.data.id];
                }
            })
            .then(function (promises) {
                let currentAlarmId = promises[0];
                if (promises.length >= 2) {
                    let newItemResponse = promises[1];
                    if (newItemResponse) {
                        let newAlarmId = newItemResponse.index;
                        return syncService
                        .syncMaps(camera_control_map)
                        .syncMapItems("alarm")
                        .update({
                            data: {
                                id: newAlarmId
                            }
                        })
                        .then(function () {
                            return syncService
                            .syncLists.create({
                                uniqueName: "cameras." + cameraId + ".archives." + newAlarmId
                            });
                        })
                        .then(function () {
                            let camera = config.cameras[cameraId];
                            return client.messages.create({
                                from: context.ALERT_FROM_NUMBER,
                                to: camera.contact_number,
                                body: "Twilio Security Camera Alarm alert from camera \"" + cameraId + "\", alert id \"" + newAlarmId + "\""
                            });
                        })
                        .then(function () {
                            return { result: "new alarm create", alarm_id: newAlarmId };
                        });
                    }
                } else {
                    return { result: "alarm archive updated", alarm_id: currentAlarmId };
                }
            })
            .then(function (result) {
                return syncService
                .syncLists("cameras." + cameraId + ".archives." + result.alarm_id)
                .syncListItems.create({
                    data: snapshotData
                })
                .then(function (response) {
                    result.archive_id = response.index;
                    callback(null, result);
                })
            })
            .catch(function (err) {
                callback(null, { result: "sync operations failed", error: err.toString() });
            });
        } else {
            callback(null, { result: "not interesting trait" });
        }
    } else {
        callback(null, { result: "not interested event type" });
    }
}
