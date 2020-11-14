import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Segment } from "semantic-ui-react";
function Buckets(props: any) {
   
    
   // const location: any = useLocation();
    const foo = JSON.stringify( props.location);
    
    return ( <Segment className="actions">
        <div>{foo}</div>

     {/* <Button onClick={photoService.createBucket}>Create Bucket</Button>
    <Button onClick={photoService.deleteBucket}>Delete Bucket</Button>  */}
</Segment>)
}
export default Buckets;