import React, {Component} from 'react';
import {Comment, Card, Image} from 'semantic-ui-react';
import moment from 'moment';
import TimeAgo from 'react-timeago'
import Extractor from 'html-extractor';

export default class RenderedText extends Component {
  constructor(props) {
    super(props);
    this.state = {loaded: false};
    this.type = '';

    this.imageStyles = {
      maxWidth: '75%'
    }
  }

  componentDidMount() {
    fetch(this.props.url)
        .then((response) => {
          if(response.ok) {
            this.type = response.headers.get('content-type');
            if (this.type.startsWith('image')) {
              return response.blob();
            } else {
              return response.text();
            }
          }
          throw new Error('Network response was not ok.');
        })
        .then((myBlob) => {
          if (this.type.startsWith('image')) {
            const objectURL = URL.createObjectURL(myBlob); 
            this.rendered = (<a rel="nofollow" target="_" href={this.props.url}><img style={this.imageStyles} src={objectURL} /></a>);
            this.setState({
              ...this.state,
              loaded: true
            });
          } 
          // else if (this.type.startsWith('text/html')) {
          //   const myExtrator = new Extractor();
          //   myExtrator.extract( myBlob, ( err, data ) => {
          //     if( err ){
          //       throw( err )
          //     } else {
          //       console.log(data)
          //       this.rendered = (
          //         <Card as='a' href={this.props.url}>
          //           <Image src={data.meta.thumbnail} />
          //           <Card.Content>
          //             <Card.Header>
          //               {data.meta.title}
          //             </Card.Header>
          //             <Card.Description>
          //               {data.meta.description}
          //             </Card.Description>
          //           </Card.Content>
          //         </Card>
          //       );

          //       this.setState({
          //         ...this.state,
          //         loaded: true
          //       });
          //     }
          //   })
          // }
        })
        .catch((e) => {
          console.log(e)
        });
  }

  render() {
    if (!this.state.loaded) return null;
    return this.rendered;
    // return (
    //     <Comment>
    //       <Comment.Avatar style={{ backgroundColor: this.props.color, height: '2.5em'}}/>
    //         <Comment.Content>
    //           <Comment.Author as='a'>{this.props.name}</Comment.Author>
    //           <Comment.Metadata>
    //             <TimeAgo date={moment.utc(this.props.timestamp)} minPeriod={15}/>
    //             {this.props.labels}
    //           </Comment.Metadata>
    //         <Comment.Text style={{fontSize: '16px'}}>
    //           {this.rendered}
    //         </Comment.Text>
    //       </Comment.Content>
    //     </Comment>
    // )
  }
}
