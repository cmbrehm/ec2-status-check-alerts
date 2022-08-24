import { EC2, EventBridge } from 'aws-sdk'

const ec2 = new EC2();

const EVENT_KEY= process.env.EVENT_KEY;
export const handler = async(_:any) => {
  if (!EVENT_KEY)
    throw new Error("please set process.env.EVENT_KEY")
    
  const { InstanceStatuses } = await ec2.describeInstanceStatus().promise()
  if (!!InstanceStatuses) {
    //const NotOK = InstanceStatuses.filter((i)=>i.InstanceStatus!='ok' || i.SystemStatus!='ok' )
    const NotOK = InstanceStatuses.filter((i)=>i.InstanceStatus?.Status!='ok' || i.SystemStatus?.Status!='ok' )
    if (!(NotOK && NotOK.length>0)) {
      console.log("no failed status checks")
      return;
    }
    const params = {
        Filters: [
          {
            Name: 'resource-id',
            Values: NotOK.map(i=>i.InstanceId || '')
          }
        ]
      };
    const { Tags } = await ec2.describeTags(params).promise();
    //TODO: filter auto-scaling groups
    const newEvents = NotOK.map((i)=>{
      let instanceTags;
      if (!!Tags) {
        instanceTags = Tags.filter(x=>x.ResourceId == i.InstanceId)
          .map((m) =>
            JSON.parse(`{"${m.Key}": "${m.Value}" }` ))
      }

      //TODO: refactor string to CDK
      return {
        Source: EVENT_KEY,
        Resources: NotOK.map(i=>i.InstanceId || ''),
        DetailType: "status-with-tags",
        Detail: JSON.stringify({
          ...i,
          Tags: instanceTags
        })
      }

    })
    if (newEvents.length >0 ) {
      const eventBridge=new EventBridge();
      console.log(JSON.stringify({Entries: newEvents}))
      //TODO: need to handle batches of 10
      let r = await eventBridge.putEvents({Entries: newEvents}).promise();
      console.log(JSON.stringify(r));
    }
  }
}
