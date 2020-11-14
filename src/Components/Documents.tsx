import React, { useState, useEffect } from 'react';

import Avatar from './Avatar';
import Photos from './Photos';
import { PhotoProps } from 'react-photo-gallery';
import "semantic-ui-css/semantic.min.css";
import Dropzone from 'react-dropzone'
// @ts-ignore
import browserImageSize from 'browser-image-size'
// @ts-ignore
import { readAndCompressImage } from 'browser-image-resizer'
import { Button, Header, Segment } from "semantic-ui-react";
import { GalleryIndex, UIAppState } from '../Types'
import '../App.css';
import PhotoServiceFactory from '../PhotoServiceFactory'

import { useAsync } from "react-async";

const loadPhotoServiceFactory = async () => {
    var service = await PhotoServiceFactory((x) => {
        console.log(x);
        //   setMessage(x);
    });
    return service;
}

function Documents() {

    const [message, setMessage] = useState<string>("");

    const [state, setState] = useState<UIAppState>({
        isLoading: true,
        isDragActive: false,
    });
    const [index, setIndex] = useState<GalleryIndex>();
    const [photos, setPhotos] = useState<PhotoProps[]>([]);

    const { data, error, isPending } = useAsync({ promiseFn: loadPhotoServiceFactory });
    
    useEffect(() => {

        setState({
            isLoading: true,
            isDragActive: true
        });

        if (!data) { return;}
        const photoService = data;
        photoService.getPhotoIndex()
            .then(indx => {
                setIndex(indx);
                photoService
                    .galleryFromIndex(photos, indx)
                    .then(pts => {
                        setPhotos(pts);
                        setState({
                            isLoading: false,
                            isDragActive: false
                        });
                    });
            });
        setMessage('loading page ...');
        // })

    }, [data]);

    if (isPending) return  (<div>pending</div>)
    if (error) return    (<div>`Something went wrong: ${error.message}`</div>)
    if (data) {

        const photoService = data;

             return (
            <div className="App">
                <Segment.Group style={{ height: "100%" }}>
                    <Segment clearing className="nav">
                        <Header className="avatar" as="h2" floated="left" title={state.identity ? state.identity : 'identity'}>
                            {state.identity && <Avatar identity={state.identity} />}
                        </Header>
                        <Header className="dropzone-container" as="h2" floated="right" title={'add photo'}>
                            {!state.isLoading && renderDropzone(photoService)}
                        </Header>
                        {state.url &&
                            (<a href={state.url} target="_blank" rel="noopener noreferrer">
                                <Button
                                    className="link"
                                    floated="right"
                                >BUCKET</Button>
                            </a>
                            )
                        }
                        {state.www &&
                            <a href={state.www} target="_blank" rel="noopener noreferrer">
                                <Button
                                    className="link"
                                    floated="right"
                                >WWW</Button>
                            </a>
                        }
                        {state.ipns &&
                            <a href={state.ipns} target="_blank" rel="noopener noreferrer">
                                <Button
                                    className="link"
                                    floated="right"
                                >IPNS</Button>
                            </a>
                        }
                    </Segment>
                   
                    <Segment className={state.isLoading ? 'rendering' : 'complete'}>
                        <Photos photos={photos} />
                    </Segment>
                    <Segment className="footer">
                        <footer>{message}</footer>

                    </Segment>
                </Segment.Group>
            </div>
        );

    }
    else {
        return (<div>some other state</div>)
    }

    async function addPhoto(photoService: any, photos: PhotoProps[], file: File) {
        setMessage('adding photo ...');
        //let { photoProps, path } = await photoService.handleNewFile(photos, file);
        let pp = await photoService.handleNewFile(photos, file)
        if (!pp?.photoProps) {
            return;
        }
        if (!pp?.path) {
            return;
        }

        setPhotos([...photos, pp.photoProps]);
        if (index) {
            setMessage('addded photo to path - ' + index.paths[0]);
            setIndex({ ...index, ...{ paths: [...index.paths, pp.path] } })
        }
    }
    
    function onDropFactory(photoService: any)
    {
     return async function onDrop(acceptedFiles: File[]) {
        setState({
            isLoading: true,
            isDragActive: true
        });
        if (photos.length > 50) {
            throw new Error('Gallery at maximum size')
        }
        if (acceptedFiles.length > 5) {
            throw new Error('Max 5 images at a time')
        }
        for (const accepted of acceptedFiles) {
            setMessage('addded file - ' + accepted.name);
            await addPhoto(photoService, photos, accepted)
        }
        if (index) {
            await photoService.storeIndex(index);
        }
        setState({
            isLoading: false,
            isDragActive: false
        });
    }
    }
   
    function renderDropzone(photoService : any) {
        return (
            <Dropzone
                onDrop={onDropFactory(photoService)}
                accept={'image/jpeg, image/png, image/gif'}
                maxSize={20000000}
                multiple={true}
            >
                {({ getRootProps, getInputProps }) => (
                    <div className="dropzone" {...getRootProps()}>
                        <input {...getInputProps()} />
                        <Button
                            className="icon"
                            icon="images"
                            title="add"
                        />
                        <span>DRAG & DROP</span>
                    </div>
                )}
            </Dropzone>
        )
    };


}

export default Documents;