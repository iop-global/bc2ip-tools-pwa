import { Injectable } from '@angular/core';
import { selectiveDigestJson } from '@internet-of-people/sdk-wasm';
import {
  BlobReader,
  BlobWriter,
  Entry,
  TextReader,
  ZipWriter,
} from '@zip.js/zip.js';
import { DateTime } from 'luxon';
import { ValidatedCreateProofFormResult } from '../types/create-proof-form';
import { SignedWitnessStatement } from '../types/statement';
import { SignerContext } from '../tools/crypto';

@Injectable({
  providedIn: 'root',
})
export class PresentationServiceService {
  async download(
    formResult: ValidatedCreateProofFormResult,
    statement: SignedWitnessStatement,
    certificateEntries: Entry[],
    signerContext: SignerContext
  ): Promise<void> {
    const doNotCollapsProps: string[] = [];

    for (const fileIdx of Object.keys(formResult.files)) {
      const file = formResult.files[fileIdx];

      if (!file.shareFile) {
        continue;
      }

      doNotCollapsProps.push(`.content.files.${fileIdx}.fileName`);
      doNotCollapsProps.push(`.content.files.${fileIdx}.hash`);

      Object.keys(file.authors).forEach((idx) => {
        if (file.authors[idx]) {
          doNotCollapsProps.push(`.content.files.${fileIdx}.authors.${idx}`);
        }
      });

      Object.keys(file.owners).forEach((idx) => {
        if (file.owners[idx]) {
          doNotCollapsProps.push(`.content.files.${fileIdx}.owners.${idx}`);
        }
      });

      if (file.uploader) {
        doNotCollapsProps.push(`.content.files.${fileIdx}.uploader`);
      }
    }

    if (formResult.shareProjectDescription) {
      doNotCollapsProps.push('.content.projectDescription');
    }

    if (formResult.shareProjectName) {
      doNotCollapsProps.push('.content.projectName');
    }

    if (formResult.shareVersionDescription) {
      doNotCollapsProps.push('.content.versionDescription');
    }

    if (formResult.shareVersionSealer) {
      doNotCollapsProps.push('.content.sealer');
    }

    const collapsedClaim = JSON.parse(
      selectiveDigestJson(statement.content.claim, doNotCollapsProps.join(','))
    );

    const collapsedStatement = JSON.parse(
      selectiveDigestJson(
        statement,
        ['.signature', '.content.constraints'].join(',')
      )
    );

    const validFrom = new Date();
    // We treat the date selected on the UI as UTC date.
    const validUntil =
      DateTime.fromISO(formResult.validUntil).toFormat('kkkk-LL-dd') +
      'T23:59:59.999Z';

    const presentation = {
      provenClaims: [
        {
          claim: collapsedClaim,
          statements: [collapsedStatement],
        },
      ],
      licenses: [
        {
          issuedTo: signerContext.priv.personas.did(0).toString(),
          purpose: formResult.purpose,
          validFrom: validFrom.toISOString(),
          validUntil,
        },
      ],
    };

    const signedPresentation = signerContext.priv
      .signClaimPresentation(signerContext.keyId, presentation)
      .toJSON();

    const signedPresentationJson = {
      content: signedPresentation.content,
      signature: signedPresentation.signature,
    };

    const zipFileWriter = new BlobWriter('application/zip');
    const zipWriter = new ZipWriter(zipFileWriter);

    await zipWriter.add(
      'signed-presentation.json',
      new TextReader(JSON.stringify(signedPresentationJson))
    );

    const filesToBePacked = certificateEntries.filter((entry) =>
      Object.values(formResult.files).some(
        (f) => f.shareFile && f.fileName === entry.filename
      )
    );

    await Promise.all(
      filesToBePacked.map((f) =>
        f
          .getData(new BlobWriter())
          .then((data) => zipWriter.add(f.filename, new BlobReader(data)))
      )
    );
    await zipWriter.close();
    const data = await zipFileWriter.getData();
    const a = document.createElement('a');

    a.href = window.URL.createObjectURL(data);
    a.download = `${statement.content.claim.content.projectName.value} - ${
      statement.content.claim.content.versionId
    }.${new Date().getTime()}.proof`;

    a.click();
  }
}
