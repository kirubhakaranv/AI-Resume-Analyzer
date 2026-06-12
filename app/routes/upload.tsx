import React, { type FormEvent, useState } from 'react';
import Navbar from '~/components/Navbar';
import FileUploader from '~/components/FileUploader';
import { usePuterStore } from '~/lib/puter';
import { useNavigate } from 'react-router';
import { convertPdfToImage } from '~/lib/pdfToImage';
import { generateUUID } from '~/lib/util';
import { prepareInstructions } from '../../constants';
import { AIResponseFormat } from '../../constants'

const Upload=()=>{
  const{auth,isLoading,fs,ai,kv}=usePuterStore();
  const navigate=useNavigate();
  const[isProcessing,setIsProcessing]=useState(false);
  const[statusText,setStatusText]=useState('');
  const [file, setFile]=useState<File | null>(null);

  const handleAnalyze=async ({companyName,jobTitle,jobDescription,file}:{companyName:string,jobTitle:string,jobDescription:string,file:File}) => {
    setIsProcessing(true);
    setStatusText("Uplaoding the file");
    const uploadedFile:any= await fs.upload([file]);
    if(!uploadedFile){
      return setStatusText("Upload failed");
    }
    setStatusText("Converting to image");
    const image=await convertPdfToImage(file);
    if(!image.file) {
      console.log(image.error);
      return setStatusText("Error:Failed to convert pdf to image");}
    setStatusText("Uploading the image...");
    const uploadedImage=await fs.upload([image.file]);
    if(!uploadedImage) return setStatusText("Error:Failed to upload image");
    setStatusText("Preparing data");
    const uuid=generateUUID();
    const data={
      id:uuid,
      resumePath:uploadedFile.path,
      imagePath:image.file,
      companyName,jobTitle,jobDescription,
      feedback:'',
    }
    await kv.set(`resume:${uuid}`,JSON.stringify(data));
    setStatusText("Analyzing");
    const feedback=await ai.feedback(
      uploadedFile.path,
      prepareInstructions({jobTitle,jobDescription,AIResponseFormat})
    )
    if(!feedback){
      setStatusText('Failed to Analyze resume');
    }
    // @ts-ignore
    const feedbackText=typeof feedback?.message?.content==='string'
    ?feedback.message.content
      :feedback?.message.content[0].text;

    data.feedback=JSON.parse(feedbackText);
    await kv.set('`resume:${uuid}`',JSON.stringify(data));
    setStatusText("Analysis Complete Redirectring");
    console.log(data);
  }
  const handleSubmit=(e:FormEvent<HTMLFormElement>)=>{
      e.preventDefault();
      const form=e.currentTarget.closest('form');
      if(!form){
        return ;
      }
      const formData=new FormData(form);
      const companyName=(formData.get('company-name'))|| "";
      const jobTitle = (formData.get('job-title')) || "";
      const jobDescription = (formData.get('job-description') )|| "";
      console.log({
        companyName,jobTitle,jobDescription
      })
    if(!file) return;
    // @ts-ignore
    handleAnalyze({companyName,jobTitle,jobDescription,file});

  }
  const handleFileSelect=(file:File | null)=>{
    setFile(file);
  }

  return (
    <main className="bg-[url('../../public/images/bg-main.svg')] bg-cover">
      <Navbar></Navbar>
      <section className={'main-section'}>
        <div className={'page-heading py-16'}>
          <h1>Smart Feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}
          {!isProcessing && (
            <form
              id={'upload-form'}
              onSubmit={handleSubmit}
              className={'flex flex-col gap-4 mt-8'}
            >
              <div className={'form-div'}>
                <label htmlFor={'company-name'}>Company Name</label>
                <input
                  type={'text'}
                  name={'company-name'}
                  placeholder={'Company Name...'}
                  id={'company-name'}
                />
              </div>
              <div className={'form-div'}>
                <label htmlFor={'job-title'}>Job Title</label>
                <input
                  type={'text'}
                  name={'job-title'}
                  placeholder={'Job Title...'}
                  id={'job-title'}
                />
              </div>
              <div className={'form-div'}>
                <label htmlFor={'job-description'}>Job Description</label>
                <textarea
                  rows={5}
                  name={'job-description'}
                  placeholder={'Job Description...'}
                  id={'job-description'}
                />
              </div>
              <div className={'form-div'}>
                <label htmlFor={'uploader'}>Upload Resume</label>
          <FileUploader onFileSelect={handleFileSelect}/>
              </div>
              <button className={"primary-button"} type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

export default Upload;