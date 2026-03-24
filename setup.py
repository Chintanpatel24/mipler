from setuptools import setup, find_packages

setup(
    name='osint-workspace',
    version='1.0.0',
    description='OSINT Investigation Workspace - Visual node-based OSINT tool',
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    author='OSINT Workspace Contributors',
    license='MIT',
    packages=find_packages(),
    include_package_data=True,
    package_data={
        'osint_workspace': ['templates/*', 'static/**/*'],
    },
    install_requires=[
        'flask>=2.3.0',
        'flask-cors>=4.0.0',
        'flask-socketio>=5.3.0',
        'python-whois>=0.8.0',
        'dnspython>=2.4.0',
        'requests>=2.31.0',
        'beautifulsoup4>=4.12.0',
        'lxml>=4.9.0',
        'Pillow>=10.0.0',
        'gevent>=23.9.0',
        'gevent-websocket>=0.10.1',
    ],
    entry_points={
        'console_scripts': [
            'osint-workspace=run:main',
        ],
    },
    python_requires='>=3.8',
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Information Technology',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
    ],
)