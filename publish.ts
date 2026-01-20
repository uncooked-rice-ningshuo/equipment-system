const lark = require('@larksuiteoapi/node-sdk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const adler32 = require('adler-32');

// 应用配置
const APP_CONFIG = {
  appId: 'cli_a9ebafb98af89bc2',
  appSecret: 'g5lJN3XPpkFfWnkY1k9Z1fNCg6fVScg8',
  releaseDir: './release',
  parentNode: 'TvGJfEcxwl4T4Bdqa06cBXu1nlb',
  chunkSize: 4 * 1024 * 1024, // 4MB分片
};

// 创建飞书客户端
const client = new lark.Client({
  appId: APP_CONFIG.appId,
  appSecret: APP_CONFIG.appSecret,
  disableTokenCache: true,
});

// 获取tenant_access_token
async function getTenantAccessToken() {
  try {
    const response = await axios.post(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        app_id: APP_CONFIG.appId,
        app_secret: APP_CONFIG.appSecret,
      },
    );

    if (response.data.code === 0) {
      return response.data.tenant_access_token;
    } else {
      throw new Error(
        `Failed to get tenant_access_token: ${response.data.msg}`,
      );
    }
  } catch (error) {
    console.error('Error getting tenant_access_token:', error);
    throw error;
  }
}

// 获取最新构建文件
function getLatestBuildFile() {
  try {
    // 检查release目录是否存在
    if (!fs.existsSync(APP_CONFIG.releaseDir)) {
      throw new Error(`Release directory ${APP_CONFIG.releaseDir} not found`);
    }

    // 获取release目录下的所有文件
    const files = fs.readdirSync(APP_CONFIG.releaseDir);

    // 过滤出安装包文件
    const buildFiles = files.filter((file: string) => {
      return /\.(dmg|exe|AppImage)$/.test(file);
    });

    if (buildFiles.length === 0) {
      throw new Error('No build files found in release directory');
    }

    // 获取最新修改的文件
    let latestFile = buildFiles[0];
    let latestMtime = fs.statSync(
      path.join(APP_CONFIG.releaseDir, latestFile),
    ).mtime;

    buildFiles.forEach((file: string) => {
      const mtime = fs.statSync(path.join(APP_CONFIG.releaseDir, file)).mtime;
      if (mtime > latestMtime) {
        latestMtime = mtime;
        latestFile = file;
      }
    });

    return path.join(APP_CONFIG.releaseDir, latestFile);
  } catch (error) {
    console.error('Error getting latest build file:', error);
    throw error;
  }
}

// 计算Adler-32校验和
function calculateAdler32(buffer: Buffer) {
  return adler32.sum(buffer).toString(10);
}

// 预上传 - 获取upload_id
async function uploadPrepare(
  fileName: string,
  fileSize: number,
  tenantToken: string,
) {
  try {
    const response = await client.drive.v1.file.uploadPrepare(
      {
        data: {
          file_name: fileName,
          parent_type: 'explorer',
          parent_node: APP_CONFIG.parentNode,
          size: fileSize,
        },
      },
      lark.withTenantToken(tenantToken),
    );

    if (response.code === 0 && response.data) {
      return {
        upload_id: response.data.upload_id,
        block_num: response.data.block_num,
      };
    } else {
      throw new Error(`Upload prepare failed: ${response.msg}`);
    }
  } catch (error) {
    console.error('Error in upload prepare:', error);
    throw error;
  }
}

// 上传分片
async function uploadPart(
  uploadId: string,
  seq: number,
  chunk: Buffer,
  tenantToken: string,
) {
  try {
    const checksum = calculateAdler32(chunk);

    await client.drive.v1.file.uploadPart(
      {
        data: {
          upload_id: uploadId,
          seq: seq,
          size: chunk.length,
          checksum: checksum,
          file: chunk,
        },
      },
      lark.withTenantToken(tenantToken),
    );
  } catch (error) {
    console.error(`Error uploading part ${seq}:`, error);
    throw error;
  }
}

// 完成上传
async function uploadFinish(
  uploadId: string,
  blockNum: number,
  tenantToken: string,
) {
  try {
    const response = await client.drive.v1.file.uploadFinish(
      {
        data: {
          upload_id: uploadId,
          block_num: blockNum,
        },
      },
      lark.withTenantToken(tenantToken),
    );

    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(`Upload finish failed: ${response.msg}`);
    }
  } catch (error) {
    console.error('Error in upload finish:', error);
    throw error;
  }
}

// 上传文件到飞书（分片上传）
async function uploadFileToFeishu() {
  try {
    // 获取最新构建文件
    const filePath = getLatestBuildFile();
    const fileName = path.basename(filePath);
    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;

    console.log(
      `File path: ${filePath}, File name: ${fileName}, File size: ${(
        fileSize /
        (1024 * 1024)
      ).toFixed(2)} MB`,
    );

    // 获取tenant_access_token
    const tenantToken = await getTenantAccessToken();
    console.log(`Tenant access token: ${tenantToken}`);

    console.log(`Uploading file: ${fileName}`);
    console.log(`File size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);

    // 预上传 - 获取upload_id
    console.log('Preparing upload...');
    const { upload_id, block_num } = await uploadPrepare(
      fileName,
      fileSize,
      tenantToken,
    );
    console.log(
      `Upload prepared. Upload ID: ${upload_id}, Block num: ${block_num}`,
    );

    // 读取文件并分片上传
    // console.log('Starting chunked upload...');
    // const fileBuffer = fs.readFileSync(filePath);
    // const totalChunks = Math.ceil(fileSize / APP_CONFIG.chunkSize);

    // for (let i = 0; i < totalChunks; i++) {
    //   const start = i * APP_CONFIG.chunkSize;
    //   const end = Math.min(start + APP_CONFIG.chunkSize, fileSize);
    //   const chunk = fileBuffer.slice(start, end);

    //   console.log(`Uploading chunk ${i + 1}/${totalChunks} (${(chunk.length / (1024 * 1024)).toFixed(2)} MB)...`);

    //   await uploadPart(upload_id, i, chunk, tenantToken);

    //   console.log(`Chunk ${i + 1}/${totalChunks} uploaded successfully`);
    // }

    // // 完成上传
    // console.log('Finishing upload...');
    // const result = await uploadFinish(upload_id, block_num, tenantToken);

    // console.log('File uploaded successfully!');
    // console.log('File token:', result.file_token);

    // return result;
  } catch (error) {
    console.error('Error uploading file to Feishu:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error(
          'API Error Response:',
          JSON.stringify((error as any).response?.data, null, 4),
        );
      } else {
        console.error('API Error Response:', JSON.stringify(error, null, 4));
      }
    }
    throw error;
  }
}

// 主函数
async function main() {
  console.log('Starting file upload to Feishu...');
  try {
    await uploadFileToFeishu();
    console.log('Upload completed successfully!');
  } catch (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  }
}

// 执行主函数
main();
