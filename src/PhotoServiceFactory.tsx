import { Buckets, KeyInfo, PrivateKey, PushPathResult, WithKeyInfoOptions } from "@textile/hub";
import { PhotoProps } from 'react-photo-gallery';
import { PhotoSample, Photo, GalleryIndex } from './Types';
// @ts-ignore
import browserImageSize from 'browser-image-size';
// @ts-ignore
import { readAndCompressImage } from 'browser-image-resizer';
const ipfsGateway = 'https://hub.textile.io';
//bvzja3q6u4edrpizbd33rujiv6m  bizrj7pjbg7i33mt473pbycdgsgcwq6g43kiej2a  account  false  

const keyInfo: KeyInfo = {
    key: 'bvzja3q6u4edrpizbd33rujiv6m'
}

const keyInfoOptions: WithKeyInfoOptions = {
    debug: true
};

const publicGallery = '<!doctype html><html lang=en><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><meta http-equiv=x-ua-compatible content="ie=edge"><meta property="twitter:description" content="built with textile.io. uses textile buckets and ipns to serve photo galleries over ipns"><title>Public Gallery</title><link rel=stylesheet href=https://cdn.jsdelivr.net/npm/glightbox/dist/css/glightbox.min.css><script src=https://cdn.jsdelivr.net/gh/mcstudios/glightbox/dist/js/glightbox.min.js></script><div class=wrapper><div class=grid></div></div><script>const loadIndex=async()=>{const elements=[]\n' +
    'const index=await fetch("index.json")\n' +
    'const json=await index.json()\n' +
    'for(let path of json.paths){try{const meta=await fetchMetadata(path)\n' +
    'elements.push({href:meta.path,type:"image"})}catch(err){console.log(err)}}\n' +
    'const lightbox=GLightbox({selector:".grid",touchNavigation:true,closeButton:false,loop:true,elements:elements,});lightbox.open();}\n' +
    'const fetchMetadata=async(path)=>{const index=await fetch(path)\n' +
    'const json=await index.json()\n' +
    'return json.original}\n' +
    'window.addEventListener("DOMContentLoaded",function(){loadIndex()});</script>';


 async function PhotoServiceFactory(logger: (x: string) => void) {

    if (!logger) {
        logger = (x) => { console.log(x);}
    }
    let identity = getIdentity();
    

    
    const { bucketKey, buckets } = await getBucketAndKey();
    function deleteBucket() {
        //   if (this.state.buckets && this.state.bucketKey) {
        //     logger("deleting bucket");
        //     console.log(JSON.stringify(this.state.buckets));
        //     return this.state
        //       .buckets
        //       .remove(this.state.bucketKey).then(_ => {
        //         this.setState({
        //           buckets: [],
        //           bucketKey: ''
        //         })
        //         console.log("successfully delted bucket");
        //       }).catch(e => {
        //         logger("************* Error! ***************");
        //         console.error(e);
        //       }
        //       );
        //   }
        //   else {
        //     console.error("****************************");
        //     console.error("buckets not set");
        //   }
    }

    async function createBucket( ) {
        if (identity) {
            logger("creating bucket");
            
            const newBuckets = await Buckets.withKeyInfo(keyInfo, keyInfoOptions)
            // Authorize the user and your insecure keys with getToken
            await newBuckets.getToken(identity);

            const buck = await newBuckets.getOrCreate('io.textile.dropzone')
            if (!buck.root) {
                logger('Failed to open bucket')
            }
            return { buckets: newBuckets, bucketKey: null };
        }
        else {
            console.error("****************************");
            console.error("buckets not set");
        }
    }

    async function getBucketAndKey(): Promise<{ buckets: Buckets, bucketKey: string }> {
        if (!identity) {
            logger('Identity not set');
        }
        const buckets = await Buckets.withKeyInfo(keyInfo, keyInfoOptions)
        // Authorize the user and your insecure keys with getToken
        await buckets.getToken(identity)

        const buck = await buckets.getOrCreate('io.textile.dropzone')
        if (!buck.root) {
            logger('Failed to open bucket');
            return { buckets: buckets, bucketKey: 'buck.root.key' }
        }
        return { buckets: buckets, bucketKey: buck.root.key };
    }

    /**
     * getBucketLinks returns all the protocol endpoints for the bucket.
     * Read more:
     * https://docs.textile.io/hub/buckets/#bucket-protocols 
     */

    // async function getBucketLinks() {
    //     if (!buckets || !bucketKey) {
    //         logger('No bucket client or root key')
    //         return
    //     }
    //     return await buckets.links(bucketKey)
    // }

    /**
     * storeIndex stores the updated index of all images in the Bucket
     * This could easily be designed to write directly to the thread
     * instead of json files. 
     * @param index 
     */
    async function storeIndex(index: GalleryIndex) {
        if (!buckets || !bucketKey) {
            logger('store index - No bucket client or root key')
            return
        }
        const buf = Buffer.from(JSON.stringify(index, null, 2))
        const path = `index.json`
        await buckets.pushPath(bucketKey, path, buf)
    }

    async function initIndex() {
        if (!identity) {
            logger('Identity not set')
            return
        }
        const index = {
            author: identity.public.toString(),
            date: (new Date()).getTime(),
            paths: []
        }
        await storeIndex(index);
        return index
    }

    async function initPublicGallery() {
        if (!buckets || !bucketKey) {
            logger('initPublicGallery -No bucket client or root key')
            return
        }
        const buf = Buffer.from(publicGallery)
        await buckets.pushPath(bucketKey, 'index.html', buf)
    }

    /**
     * galleryFromIndex parses the index.json and pulls the metadata for each image
     * @param index 
     */
 

    async function galleryFromIndex(photos : PhotoProps [] , index: GalleryIndex | undefined)   {
        if (!buckets || !bucketKey) {
            logger('galleryFromIndex - No bucket client or root key')
            return [];
        }
        if (!index) {
            logger('No index set');
            return [];
        }
        var result : PhotoProps [] = [...photos];

        for (let path of index.paths) {
            const metadata = await buckets.pullPath(bucketKey, path)
            const linlsObj = await buckets.links(bucketKey);
            logger(JSON.stringify(linlsObj));
            const { value } = await metadata.next();
            let str = "";
            for (var i = 0; i < value.length; i++) {
                str += String.fromCharCode(parseInt(value[i]));
            }
            const json: Photo = JSON.parse(str)
            const photo = index.paths.length > 1 ? json.preview : json.original
           result.push({
            src: `${ipfsGateway}/ipfs/${photo.cid}`,
            width: photo.width,
            height: photo.height,
            key: photo.name,
          });  
    }
    return result;
}

    async function getPhotoIndex() : Promise<GalleryIndex | undefined> {
        if (!buckets || !bucketKey) {
            logger('getPhotoIndex - No bucket client or root key')
            return;
        }
        try {
            const metadata = buckets.pullPath(bucketKey, 'index.json')
            const { value } = await metadata.next();
            let str = "";
            for (var i = 0; i < value.length; i++) {
                str += String.fromCharCode(parseInt(value[i]));
            }
            const index: GalleryIndex = JSON.parse(str)
            return index;
        } catch (error) {
            const index = await initIndex();
            await initPublicGallery();
        
            return index
        }
    }

    /**
     * Pushes files to the bucket
     * @param file 
     * @param path 
     */
    async function insertFile(file: File, path: string): Promise<PushPathResult> {
        if (!buckets || !bucketKey) {
            throw new Error('insertFile -No bucket client or root key')
        }
       // const buckets: Buckets = buckets
        return await buckets.pushPath(bucketKey, path, file.stream())
    }

    /**
     * processAndStore resamples the image and extracts the metadata. Next, it
     * calls insertFile to store each of the samples plus the metadata in the bucket.
     * @param image 
     * @param path 
     * @param name 
     * @param limits 
     */
    async function processAndStore(image: File, path: string, name: string, limits?: { maxWidth: number, maxHeight: number }): Promise<PhotoSample> {
        const finalImage = limits ? await readAndCompressImage(image, limits) : image
        const size = await browserImageSize(finalImage)
        const location = `${path}${name}`
        const raw = await insertFile(finalImage, location)
        const metadata = {
            cid: raw.path.cid.toString(),
            name: name,
            path: location,
            ...size
        }
        return metadata
    }

    async function handleNewFile (photos: PhotoProps[], file: File)  {
        const preview = {
            maxWidth: 800,
            maxHeight: 800
        };
        const thumb = {
            maxWidth: 200,
            maxHeight: 200
        };
        if (!buckets || !bucketKey) {
            logger('handle new file - No bucket client or root key');
            return;
        }
        const imageSchema: { [key: string]: any } = {};
        const now = new Date().getTime();
        imageSchema['date'] = now;
        imageSchema['name'] = `${file.name}`;
        const filename = `${now}_${file.name}`;

        imageSchema['original'] = await processAndStore(file, 'originals/', filename);

        imageSchema['preview'] = await processAndStore(file, 'previews/', filename, preview);

        imageSchema['thumb'] = await processAndStore(file, 'thumbs/', filename, thumb);

        const metadata = Buffer.from(JSON.stringify(imageSchema, null, 2));
        const metaname = `${now}_${file.name}.json`;
        const path = `metadata/${metaname}`;
        await buckets.pushPath(bucketKey, path, metadata);

        const photo = photos.length > 1 ? imageSchema['preview'] : imageSchema['original']

        var photoProps : PhotoProps = {
            src: `${ipfsGateway}/ipfs/${photo.cid}`,
            width: photo.width,
            height: photo.height,
            key: photo.name,
          };

          return {photoProps, path};
    }

    function getIdentity(): PrivateKey {
        try {
            var storedIdent = localStorage.getItem("identity")
            if (storedIdent === null) {
                throw new Error('No identity')
            }
            const restored = PrivateKey.fromString(storedIdent)
            return restored
        }
        catch (e) {
            /**
             * If any error, create a new identity.
             */
            logger('could not get identity use randome..');
            try {
                const identity = PrivateKey.fromRandom()
                const identityString = identity.toString()
                localStorage.setItem("identity", identityString)
                return identity
            } catch (err) {
                logger(err);
                return err.message
            }
        }
    }

    

    return Object.freeze({
        createBucket,
        deleteBucket,
        handleNewFile,
        storeIndex,
        getPhotoIndex,
        galleryFromIndex,
       
        
    });
}

export default PhotoServiceFactory;