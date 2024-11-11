import os 
import subprocess
import json
import platform 
from pathlib import Path 
import sys

def get_whisper_model_path(base_model='large-v2'):
    ''' get path to whisper model
    :param base_mode: (str) 'large-v2' or 'base' 
    :return: path to model file'''
    models = {
        'large-v2': 'ggml-large-v2-q8_0.bin',
        'base': 'ggml-base-q8_0.bin'
    }
    return os.path.join('..','whispercpp','models',models.get(base_model,models['large-v2']))

def convert_audio(input_file,current_os):
    ''' 
    Convert dss/ds2 files to WAV format
    :param input_file: (file path) path to ds2/dss 
    :param current_os: (str) current OS 
    ''' 
    file_extension= os.path.splitext(input_file)[-1].lower()

    if file_extension not in ['.ds2', '.dss']:
        print('Error: only ds2/dss files are supported')
        return

    try:
        print(f'Using Switch for proprietary format conversion')
        convert_with_switch(input_file,current_os)
        return 1
    except Exception as e:
        print(f'Conversion failed with: {e}')
        return -1 

def prepare_ffmpeg(audio_file,current_os):
    '''
    prepare audio file with ffmpeg
    :param audio_file: (str) path to file
    :param current_os: (str) current OS'''
    input_path = os.path.join('input_files',os.path.basename(audio_file))
    output_path = os.path.join('output_files',os.path.basename(audio_file))
    command = [
        'ffmpeg',
        '-y',
        '-i', input_path,
        '-ar', '16000',
        '-ac', '1',
        '-c:a', 'pcm_s16le',
        output_path
    ]
    subprocess.run(command)
    return 1
    
def map_to_windows_path(linux_path, current_os):
    """
    Convert Linux/Mac paths to Windows format for Wine
    :param linux_path: (str) Linux/Mac style path
    :param current_os: (str) current operating system
    :return: (str) Windows style path
    """
    if current_os == 'windows':
        return linux_path
        
    path_parts = Path(linux_path).absolute().parts
    
    if current_os == 'linux':
        if path_parts[0] == '/' and path_parts[1] == 'home':
            win_path = ['C:', 'users'] + list(path_parts[2:])
        else:
            win_path = ['C:'] + list(path_parts[1:])
    else:  # mac ? 
        if path_parts[0] == '/' and path_parts[1] == 'Users':
            win_path = ['C:', 'users'] + list(path_parts[2:])
        else:
            win_path = ['C:'] + list(path_parts[1:])
            
    return '\\'.join(win_path)

def convert_with_switch(input_file, current_os):
    """
    Convert to wav using Switch through CLI interface
    :param input_file: (str) input filename
    :param current_os: (str) current operating system
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_dir = os.path.join(base_dir, 'input_files')
    
    if current_os == 'windows':
        switch_path = r'C:\Program Files (x86)\NCH Software\Switch\switch.exe'
        win_input_dir = os.path.dirname(input_file)
        win_input_file = input_file
    else:  # wine -- haven't tested various os's yet
        switch_path = r'C:\Program Files (x86)\NCH Software\Switch\switch.exe'
        input_dir = os.path.dirname(input_file)
        win_input_dir = map_to_windows_path(input_dir, current_os)
        win_input_file = map_to_windows_path(input_file, current_os)

    command = [
        'wine' if current_os != 'windows' else switch_path,
        switch_path if current_os != 'windows' else None,
        '-hide',
        '-outfolder', win_input_dir,
        '-format', 'wav',
        '-convert', win_input_file,
        '-overwrite', 'ALWAYS',
        '-exit'
    ]
    
    command = [cmd for cmd in command if cmd is not None]
    
    print(f"Input file: {input_file}")
    print(f"Mapped input file: {win_input_file}")
    print(f"Executing command: {command}")
    subprocess.run(command)

def prepare_whisper_transcript(input_file, current_os, use_gpu=True, model='base'):
    '''
    Run whispercpp 
    :param input_file: (str) path to audio file
    :param current_os: (str) current OS
    :param use_gpu: (bool) use GPU
    :param model: (str) model to use ('large-v2' or 'base')
    '''
    # Use sys._MEIPASS for PyInstaller bundled environment
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        # Development environment
        base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    print(f'Current file location: {__file__}')
    print(f'Base path from MEIPASS: {base_path}')
    
    # Construct paths relative to the executable location
    if getattr(sys, 'frozen', False):
        whisper_path = os.path.join(os.path.dirname(sys.executable), 'whispercpp', 'main')
        model_path = os.path.join(os.path.dirname(sys.executable), 'whispercpp', 'models',
                                 'ggml-large-v2-q8_0.bin' if model == 'large-v2' else 'ggml-base-q8_0.bin')
    else:
        whisper_path = os.path.join(base_path, 'bin', 'whispercpp', 'main')
        model_path = os.path.join(base_path, 'bin', 'whispercpp', 'models',
                                 'ggml-large-v2-q8_0.bin' if model == 'large-v2' else 'ggml-base-q8_0.bin')

    print(f'Executable dir: {os.path.dirname(sys.executable)}')
    print(f'Whisper path: {whisper_path}')
    print(f'Model path: {model_path}')
    print(f'Input file: {input_file}')

    # Verify paths exist
    if not os.path.exists(whisper_path):
        raise FileNotFoundError(f'Whisper executable not found at: {whisper_path}')
    if not os.path.exists(model_path):
        raise FileNotFoundError(f'Model file not found at: {model_path}')
    if not os.path.exists(input_file):
        raise FileNotFoundError(f'Input audio file not found at: {input_file}')

    command = [
        whisper_path,
        '-m', model_path,
        '-f', input_file,
        '-ojf', #ojf = full json
        '-sow', #split on word
    ]
    if not use_gpu:
        command.append('-ng') 

    try:
        print(f'Running command: {" ".join(command)}')  # Debug log
        result = subprocess.run(command, capture_output=True, text=True)
        print(f'Command output: {result.stdout}')       # Debug log
        print(f'Command errors: {result.stderr}')       # Debug log
        
        if result.returncode != 0:
            raise Exception(f'Whisper command failed with code {result.returncode}')
            
        json_path = f'{input_file}.json'
        if os.path.exists(json_path):
            with open(json_path) as f: 
                data = json.load(f)
            return data 
        else:
            raise Exception(f'Output JSON file not found at {json_path}')
    except Exception as e:
        print(f'Error running whisper: {e}')
        return None 

def load_json(input_file):
    '''load json file and return transcript
    :param input_file: (str) path to json file'''

    json_file_path = f"{input_file}.json"
    print(f'Loading json file: {json_file_path}')
    if(os.path.exists(json_file_path)):
        try:
            with open(json_file_path,'r') as f: 
                return json.load(f)
        except json.JSONDecodeError as e:
            print(f'Error decoding json: {e}')
            return None 
    else:
        print(f'Json file does not exist: {json_file_path}')
        return None 