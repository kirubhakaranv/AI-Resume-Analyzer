import { useNavigate, useParams } from 'react-router';
import {Link} from 'react-router';
import type { Route } from '../../.react-router/types/app/routes/+types/home';
import { useEffect, useState } from 'react';
import { usePuterStore } from '~/lib/puter';
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

const Resume=()=>{
  const {auth,isLoading,fs,kv}=usePuterStore();
  const {id}=useParams();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState("");
  const navigate=useNavigate();
  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume${id}`);
  }, [auth.isAuthenticated]);
  useEffect(()=>{
    const loadResume=async()=>{
      const resume=await kv.get(`resume:${id}`);
      if(!resume) return;
      const data=JSON.parse(resume);
      console.log('Resume Data:', data);
      console.log('resumePath:', data.resumePath);
      console.log('imagePath:', data.imagePath);
      const resumeBlob=await fs.read(data.resumePath);
      if(!resumeBlob) return;
      const pdfBlob=new Blob([resumeBlob],{type:"application/pdf"});
      const resumeUrl=URL.createObjectURL(pdfBlob);
      setResumeUrl(resumeUrl);
      const imageBlob = await fs.read(data.imagePath.puter_full_path);

      if (imageBlob) {
        const imageUrl = URL.createObjectURL(imageBlob);
        setImageUrl(imageUrl);
      }
      setFeedback(data.feedback);
      console.log({resumeUrl,imageBlob,feedback:data.feedback});
    }
    loadResume();
  },[id]);
  return (
    <main className="!pt-0">
      <nav className={"resume-nav"}>
        <Link to={"/"} className={"back-button"}>
          <img src={"/icons/back.svg"} alt={"logo"} className={"w-2.5 h-2.5"}/>
          <span className={"text-gray-800 font-semibold"}>Back to HomePage</span>
        </Link>
      </nav>
      <div className={"flex flex-row w-full max-lg:flex-col-reverse"}>
        <section className={"feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] w-[50%] sticky mt-35  items-center justify-center"}>
          {imageUrl && resumeUrl && (
            <div className={"animate-in fade-in duration-1000 gradient-border max-sm:m-0-h-[90%] max-wxl:h-fit w-fit"}>
                        <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                          <img src={imageUrl} className="w-full h-full object-contain rounded-2xl" title={"resume"} alt={"resumeimg"}/>
                        </a>
            </div>
          )}
        </section>
        <section className={"feedback-section"}>
          <h2 className={"text-4xl !text-black font-bold"}>Resume Review</h2>
          {feedback?(
            <div className={"flex flex-col gap-8 animate-in fade-in duraction-1000"}>
              Summary ATS Details
            </div>
          ):(
            <img src={"/images/resume-scan-2.gif"} className={"w-full"}/>
          )}
        </section>
      </div>
    </main>
  )
}

export default Resume;