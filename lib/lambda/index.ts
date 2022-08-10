import { EC2, EventBridge } from 'aws-sdk'

const ec2 = new EC2();
export const handler = async(_:any) => {
  const { InstanceStatuses } = await ec2.describeInstanceStatus().promise()
  if (!!InstanceStatuses) {
    const NotOK = InstanceStatuses.filter((i)=>i.InstanceStatus!='ok' || i.SystemStatus!='ok' )
    const params = {
        Filters: [
          {
            Name: 'resource-id',
            Values: NotOK.map(i=>i.InstanceId || '')
          }
        ]
      };
    const { Tags } = await ec2.describeTags(params).promise();
    const newEvents = NotOK.map((i)=>{
      let instanceTags;
      if (!!Tags) {
        instanceTags = Tags.filter(x=>x.ResourceId == i.InstanceId)
          .map((m) =>
            { return ({ 'Key': m.Key, 'Value': m.Value }) })
      }
      return {
        Source: i.InstanceId,
        Detail: {
          ...i,
          ...instanceTags
        }
      }

    })

    const eventBridge=new EventBridge();
    console.log(JSON.stringify({Entries: newEvents}))
  //  await eventBridge.putEvents({Entries: newEvents}).promise();
  }
}
