import os 
import sys 
import platform 
from concurrent.futures import ThreadPoolExecutor
import utils
import subprocess
def check_gpu_availability():
    '''check GPU availability for whispercpp'''
    current_os = platform.system().lower()
    try:
        if current_os =='windows':
            subprocess.run(['nvidia-smi'],check=True,capture_output=True)
        else:
            subprocess.run(['nvidia-smi'],check=True,capture_output=True) 
            subprocess.run(['nvcc', '--version'],check=True,capture_output=True)
        return True # if we get here they worked
    except (subprocess.SubprocessError, FileNotFoundError):
        print('GPU not detected or CUDA not installed properly')
        return False

def get_base_path():
    '''get app base path'''
    if getattr(sys, 'frozen', False):
        # Go up one level from bin to get to project root
        return os.path.dirname(os.path.dirname(sys.executable))
    # We're in bin/, need to go up one level
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def build_path(base_path, subfolder, filename):
    '''construct os agnostic path'''
    # Remove 'bin' from path if it exists
    base_path = base_path.replace(os.path.join('scribe_new', 'bin'), 'scribe_new')
    return os.path.join(base_path, subfolder, filename)

def transcribe(audio_file, model='large-v2'):
    '''
    Converts files to wav and runs whisper transcription with whispercpp
    :param audio_file: (str) path to audio file
    :returns: success state (int) 1 if success, -1 if failure
    '''
    current_os = platform.system().lower()
    base_path = get_base_path()
    use_gpu = check_gpu_availability()
    print(f'Base path: {base_path}')
    print(f'System info: OS: {current_os}, GPU Available::{use_gpu}')
    if not use_gpu:
        print('Warning falling back to CPU. Transcription will be slower')
    print(f'received file path to transcribe:{audio_file}')
    filename = os.path.splitext(os.path.basename(audio_file))[0]

    if(audio_file.endswith('.DS2')):
        wav_path = build_path(base_path, 'input_files', f'{filename}.wav')
        print(f'WAV path: {wav_path}')
        if not os.path.exists(wav_path):
            print('converting ds2 to wav')
            res=utils.convert_audio(audio_file,current_os)
            if res == -1:
                print('Failed to convert ds2 to wav')
                return -1 
        audio_file = wav_path
    
    output_wav_path = build_path(base_path, 'output_files', f'{filename}.wav')
    print(f'Output WAV path: {output_wav_path}')
    if not os.path.exists(output_wav_path):
        print('formatting file for whisper')
        res=utils.prepare_ffmpeg(audio_file,current_os)
        if res == -1:
            print('Failed to format file for whisper')
            return -1 
    audio_file=output_wav_path 

    print(f'running whisper on: {audio_file}')
    if not os.path.exists(f'{audio_file}.json'):
        executor = ThreadPoolExecutor(max_workers=1)
        future = executor.submit(utils.prepare_whisper_transcript,audio_file,current_os, use_gpu=use_gpu, model=model)
        result = future.result()
        print(f'Whisper result: {result}')
        executor.shutdown(wait=True)
        return 1 if result is not None else -1
    return -1

if __name__ == '__main__':
    print('running ...')
    if len(sys.argv) <2:
        print('please provide a file path')
        sys.exit(1)
    
    model = sys.argv[2] if len(sys.argv)>2 else 'large-v2'
    if model not in ['large-v2','base']:
        print('invalid model specified, using default model')
        model = 'large-v2'
    
    audio_file = sys.argv[1]
    res = transcribe(audio_file,model)
    print('successfully transcribed' if res==1 else 'transcription failed')
    