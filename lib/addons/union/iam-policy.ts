export const UnionIAMPolicy = (bucket: string) => {
  return {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "Statement1",
        "Effect": "Allow",
        "Action": [
          "s3:DeleteObject*",
          "s3:GetObject*",
          "s3:ListBucket",
          "s3:PutObject*"
        ],
        "Resource": [
          `arn:aws:s3:::${bucket}`,
          `arn:aws:s3:::${bucket}/*`
        ]
      }
    ]
  }
}
